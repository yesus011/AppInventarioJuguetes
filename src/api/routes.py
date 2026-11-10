"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from datetime import date
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from api.models import db, InventoryExit, InventoryItem, User

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        if get_jwt().get("role") != "admin":
            return jsonify({"message": "Se requiere rol de administrador"}), 403
        return fn(*args, **kwargs)
    return wrapped


def approved_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        user = User.query.get(get_jwt_identity())
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
        role="user",
        status="pending",
        is_active=False,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registro recibido. Pendiente de aprobación."}), 201


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

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": token, "user": user.serialize()}), 200


@api.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user or user.status != "approved" or not user.is_active:
        return jsonify({"message": "Usuario no encontrado"}), 401
    return jsonify({"user": user.serialize()}), 200


@api.route('/admin/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([user.serialize() for user in users]), 200


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
    description = data.get("description", "").strip()
    condition = data.get("condition", "").strip()
    quantity = data.get("quantity")
    if not description or condition not in ("Nuevo", "Usado", "Dañado"):
        return jsonify({"message": "Descripción y condición válida son obligatorias"}), 400
    if not isinstance(quantity, int) or quantity < 0:
        return jsonify({"message": "La cantidad debe ser un entero no negativo"}), 400
    item = InventoryItem(
        description=description,
        quantity=quantity,
        image_url=data.get("image_url"),
        condition=condition,
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
    item = InventoryItem.query.filter_by(id=item_id).with_for_update().first_or_404()
    if item.quantity + delta < 0:
        return jsonify({"message": "El ajuste supera la cantidad disponible"}), 409
    item.quantity += delta
    db.session.commit()
    return jsonify({"item": item.serialize()}), 200


@api.route('/inventory/exits', methods=['POST'])
@approved_required
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
    destination = data.get("destination", "").strip()
    if type(quantity) is not int or quantity <= 0 or not destination:
        return jsonify({"message": "Destino y cantidad positiva son obligatorios"}), 400
    if quantity > item.quantity:
        return jsonify({"message": "No hay cantidad suficiente en inventario"}), 409

    item.quantity -= quantity
    entry = InventoryExit(
        item_id=item.id,
        destination=destination,
        exit_date=exit_date,
        quantity=quantity,
        created_by=int(get_jwt_identity()),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"exit": entry.serialize(), "item": item.serialize()}), 201
