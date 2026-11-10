"""Add user roles and inventory tables.

Revision ID: 42e1b5d813a0
Revises: 0763d677d453
Create Date: 2026-10-30
"""
from alembic import op
import sqlalchemy as sa


revision = '42e1b5d813a0'
down_revision = '0763d677d453'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user', sa.Column('role', sa.String(length=20), nullable=False, server_default='user'))
    op.add_column('user', sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'))
    op.execute("UPDATE \"user\" SET status = 'approved' WHERE is_active = TRUE")
    op.create_table(
        'inventory_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('image_url', sa.String(length=1000), nullable=True),
        sa.Column('condition', sa.String(length=30), nullable=False),
        sa.CheckConstraint('quantity >= 0', name='ck_inventory_item_quantity_nonnegative'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'inventory_exit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('destination', sa.String(length=200), nullable=False),
        sa.Column('exit_date', sa.Date(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('quantity > 0', name='ck_inventory_exit_quantity_positive'),
        sa.ForeignKeyConstraint(['created_by'], ['user.id']),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_item.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('inventory_exit')
    op.drop_table('inventory_item')
    op.drop_column('user', 'status')
    op.drop_column('user', 'role')