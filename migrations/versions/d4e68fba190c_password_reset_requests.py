"""Add administrator-managed password recovery.

Revision ID: d4e68fba190c
Revises: c9d11e2a5b37
Create Date: 2026-11-11
"""
from alembic import op
import sqlalchemy as sa


revision = "d4e68fba190c"
down_revision = "c9d11e2a5b37"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user",
        sa.Column("auth_version", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "user",
        sa.Column("password_reset_requested", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column("user", "password_reset_requested")
    op.drop_column("user", "auth_version")
