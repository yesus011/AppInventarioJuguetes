"""Add inventory access roles.

Revision ID: c9d11e2a5b37
Revises: b7c8d901e2f4
Create Date: 2026-11-11
"""
from alembic import op


revision = "c9d11e2a5b37"
down_revision = "b7c8d901e2f4"
branch_labels = None
depends_on = None


def upgrade():
    op.execute('UPDATE "user" SET role = \'inventory_editor\' WHERE role = \'user\'')


def downgrade():
    op.execute(
        'UPDATE "user" SET role = \'user\' '
        'WHERE role IN (\'inventory_editor\', \'inventory_manager\')'
    )
