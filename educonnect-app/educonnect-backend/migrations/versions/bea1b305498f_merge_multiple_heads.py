"""merge multiple heads

Revision ID: bea1b305498f
Revises: b771cebef2bd, e60e145319de
Create Date: 2026-01-05 11:31:31.883116

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bea1b305498f'
down_revision = ('b771cebef2bd', 'e60e145319de')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
