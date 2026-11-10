"""Add inventory details and exit observations.

Revision ID: b7c8d901e2f4
Revises: 42e1b5d813a0
Create Date: 2026-11-10
"""
from alembic import op
import sqlalchemy as sa


revision = "b7c8d901e2f4"
down_revision = "42e1b5d813a0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("inventory_item", sa.Column("brand", sa.String(length=100), nullable=True))
    op.add_column("inventory_item", sa.Column("toy_type", sa.String(length=100), nullable=True))
    op.add_column("inventory_item", sa.Column("age", sa.String(length=50), nullable=True))
    op.add_column("inventory_item", sa.Column("observations", sa.Text(), nullable=True))
    op.add_column("inventory_exit", sa.Column("observations", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("inventory_exit", "observations")
    op.drop_column("inventory_item", "observations")
    op.drop_column("inventory_item", "age")
    op.drop_column("inventory_item", "toy_type")
    op.drop_column("inventory_item", "brand")
