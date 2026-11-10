
import click
from api.models import db, User
from werkzeug.security import generate_password_hash

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-users" that you can run from the command line
    by typing: $ flask insert-test-users 5
    Note: 5 is the number of users to add
    """
    @app.cli.command("insert-test-users") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = generate_password_hash("12345678")
            user.is_active = True
            user.status = "approved"
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass

    @app.cli.command("seed-admin")
    def seed_admin():
        import os

        email = os.getenv("ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("ADMIN_PASSWORD", "")
        if not email or len(password) < 8:
            raise click.ClickException("Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres).")
        admin = User.query.filter_by(email=email).first()
        if admin:
            admin.role = "admin"
            admin.status = "approved"
            admin.is_active = True
            admin.password = generate_password_hash(password)
        else:
            db.session.add(User(
                email=email,
                password=generate_password_hash(password),
                role="admin",
                status="approved",
                is_active=True,
            ))
        db.session.commit()
        click.echo("Cuenta de administrador inicializada.")