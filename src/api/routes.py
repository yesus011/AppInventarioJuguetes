"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from datetime import date
from functools import wraps
import secrets

from flask import Blueprint, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from api.models import db, InventoryExit, InventoryItem, User

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


def authenticated_user():
    user = User.query.get(get_jwt_identity())
    if not user or get_jwt().get("auth_version", 0) != user.auth_version:
        return None
    return user


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        user = authenticated_user()
        if not user or user.role != "admin" or user.status != "approved" or not user.is_active:
            return jsonify({"message": "Se requiere rol de administrador"}), 403
        return fn(*args, **kwargs)
    return wrapped


def inventory_manager_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        user = authenticated_user()
        if not user or user.status != "approved" or not user.is_active:
            return jsonify({"message": "La cuenta no está aprobada"}), 403
        if user.role not in ("admin", "inventory_manager"):
            return jsonify({"message": "No tienes permiso para registrar salidas"}), 403
        return fn(*args, **kwargs)
    return wrapped


def approved_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        user = authenticated_user()
        if not user or user.status != "approved" or not user.is_active:
            return jsonify({"message": "La cuenta no está aprobada"}), 403
        return fn(*args, **kwargs)
    return wrapped


@api.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or len(password) < 8:
        return jsonify({"message": "Correo requerido y contraseña de al menos 8 caracteres"}), 400
    email = email.strip().lower()
    if not email or "@" not in email:
        return jsonify({"message": "Correo electrónico inválido"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "El correo ya está registrado"}), 409

    user = User(
        email=email,
        password=generate_password_hash(password),
        role="inventory_editor",
        status="pending",
        is_active=False,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registro recibido. Pendiente de aprobación."}), 201


@api.route('/auth/password-reset-requests', methods=['POST'])
def request_password_reset():
    data = request.get_json(silent=True)
    email = data.get("email") if isinstance(data, dict) else None
    if isinstance(email, str):
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user and user.role != "admin" and not user.password_reset_requested:
            user.password_reset_requested = True
            db.session.commit()
    return jsonify({
        "message": "Si la cuenta puede solicitar recuperación, la solicitud quedó registrada para revisión del administrador.",
    }), 202


@api.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"message": "Correo o contraseña incorrectos"}), 401
    email = email.strip().lower()
    user = User.query.filter_by(email=email).first()
    try:
        valid_password = user and check_password_hash(user.password, password)
    except (TypeError, ValueError):
        valid_password = False
    if not valid_password:
        return jsonify({"message": "Correo o contraseña incorrectos"}), 401
    if user.status != "approved" or not user.is_active:
        return jsonify({"message": "La cuenta está pendiente o fue rechazada"}), 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "auth_version": user.auth_version},
    )
    return jsonify({"access_token": token, "user": user.serialize()}), 200


@api.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = authenticated_user()
    if not user or user.status != "approved" or not user.is_active:
        return jsonify({"message": "Usuario no encontrado"}), 401
    return jsonify({"user": user.serialize()}), 200


@api.route('/admin/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([user.serialize() for user in users]), 200


@api.route('/admin/users/<int:user_id>/password-reset', methods=['POST'])
@admin_required
def reset_user_password(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"message": "No se puede restablecer la cuenta de otro administrador desde aquí"}), 400
    if not user.password_reset_requested:
        return jsonify({"message": "El usuario no tiene una solicitud de recuperación pendiente"}), 409

    temporary_password = secrets.token_urlsafe(24)
    user.password = generate_password_hash(temporary_password)
    user.password_reset_requested = False
    user.auth_version += 1
    db.session.commit()
    return jsonify({
        "message": "Contraseña restablecida. Compártela con el usuario por un canal seguro.",
        "new_password": temporary_password,
        "user": user.serialize(),
    }), 200


@api.route('/admin/users/<int:user_id>/status', methods=['PATCH'])
@admin_required
def update_user_status(user_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("approved", "rejected"):
        return jsonify({"message": "Estado inválido"}), 400
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"message": "No se puede cambiar el estado del administrador"}), 400
    user.status = status
    user.is_active = status == "approved"
    db.session.commit()
    return jsonify({"user": user.serialize()}), 200


@api.route('/admin/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def update_user_role(user_id):
    data = request.get_json(silent=True) or {}
    role = data.get("role")
    if role not in ("inventory_editor", "inventory_manager"):
        return jsonify({"message": "Rol inválido"}), 400
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"message": "No se puede cambiar el rol del administrador"}), 400
    user.role = role
    db.session.commit()
    return jsonify({"user": user.serialize()}), 200


@api.route('/inventory', methods=['GET'])
@approved_required
def list_inventory():
    items = InventoryItem.query.order_by(InventoryItem.description.asc()).all()
    exits = InventoryExit.query.order_by(InventoryExit.exit_date.desc(), InventoryExit.id.desc()).all()
    return jsonify({
        "items": [item.serialize() for item in items],
        "exits": [entry.serialize() for entry in exits],
    }), 200


@api.route('/inventory', methods=['POST'])
@approved_required
def create_inventory_item():
    data = request.get_json(silent=True) or {}
    description = data.get("description")
    condition = data.get("condition")
    brand = data.get("brand", "")
    age = data.get("age", "")
    quantity = data.get("quantity")
    if (
        not isinstance(description, str)
        or not description.strip()
        or not isinstance(condition, str)
        or condition.strip() not in ("Nuevo", "Usado", "Dañado")
    ):
        return jsonify({"message": "Descripción y condición válida son obligatorias"}), 400
    if (
        not isinstance(brand, str)
        or len(brand.strip()) > 100
        or not isinstance(age, str)
        or len(age.strip()) > 50
    ):
        return jsonify({"message": "Marca o edad inválida"}), 400
    if not isinstance(quantity, int) or quantity < 0:
        return jsonify({"message": "La cantidad debe ser un entero no negativo"}), 400
    item = InventoryItem(
        description=description.strip(),
        quantity=quantity,
        image_url=data.get("image_url"),
        condition=condition.strip(),
        brand=brand.strip() or None,
        age=age.strip() or None,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": item.serialize()}), 201


@api.route('/inventory/<int:item_id>/adjust', methods=['POST'])
@approved_required
def adjust_inventory(item_id):
    data = request.get_json(silent=True) or {}
    delta = data.get("delta")
    if not isinstance(delta, int) or delta == 0:
        return jsonify({"message": "El ajuste debe ser un entero distinto de cero"}), 400
    if delta < 0:
        user = authenticated_user()
        if user.role not in ("admin", "inventory_manager"):
            return jsonify({"message": "No tienes permiso para descontar existencias"}), 403
    item = InventoryItem.query.filter_by(id=item_id).with_for_update().first_or_404()
    if item.quantity + delta < 0:
        return jsonify({"message": "El ajuste supera la cantidad disponible"}), 409
    item.quantity += delta
    db.session.commit()
    return jsonify({"item": item.serialize()}), 200


@api.route('/inventory/exits', methods=['POST'])
@inventory_manager_required
def create_inventory_exit():
    data = request.get_json(silent=True) or {}
    try:
        exit_date = date.fromisoformat(data.get("date", ""))
    except (TypeError, ValueError):
        return jsonify({"message": "Fecha de salida inválida"}), 400
    item_id = data.get("item_id")
    if type(item_id) is not int:
        return jsonify({"message": "Artículo inválido"}), 400
    item = InventoryItem.query.filter_by(id=item_id).with_for_update().first_or_404()
    quantity = data.get("quantity")
    destination = data.get("destination")
    observations = data.get("observations", "")
    if type(quantity) is not int or quantity <= 0 or not isinstance(destination, str) or not destination.strip():
        return jsonify({"message": "Destino y cantidad positiva son obligatorios"}), 400
    if not isinstance(observations, str) or len(observations.strip()) > 2000:
        return jsonify({"message": "La observación no puede superar 2000 caracteres"}), 400
    if quantity > item.quantity:
        return jsonify({"message": "No hay cantidad suficiente en inventario"}), 409

    item.quantity -= quantity
    entry = InventoryExit(
        item_id=item.id,
        destination=destination.strip(),
        exit_date=exit_date,
        quantity=quantity,
        created_by=int(get_jwt_identity()),
        observations=observations.strip() or None,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"exit": entry.serialize(), "item": item.serialize()}), 201
