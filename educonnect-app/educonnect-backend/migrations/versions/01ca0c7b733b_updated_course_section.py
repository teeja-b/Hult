"""updated course section

Revision ID: 01ca0c7b733b
Revises: 7d180540e982
Create Date: 2025-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '01ca0c7b733b'
down_revision = '7d180540e982'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Create course_section table only if it doesn't exist
    if 'course_section' not in inspector.get_table_names():
        op.create_table('course_section',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['course.id'], name='fk_course_section_course_id'),
        sa.PrimaryKeyConstraint('id')
        )
    
    # Add columns to course_material table only if they don't exist
    existing_columns = [col['name'] for col in inspector.get_columns('course_material')]
    
    with op.batch_alter_table('course_material', schema=None) as batch_op:
        if 'section_id' not in existing_columns:
            batch_op.add_column(sa.Column('section_id', sa.Integer(), nullable=True))
        if 'description' not in existing_columns:
            batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        
        # Check if foreign key already exists
        existing_fks = [fk['name'] for fk in inspector.get_foreign_keys('course_material')]
        if 'fk_course_material_section_id' not in existing_fks:
            batch_op.create_foreign_key('fk_course_material_section_id', 'course_section', ['section_id'], ['id'])

    # Add columns to course table only if they don't exist
    existing_course_columns = [col['name'] for col in inspector.get_columns('course')]
    
    with op.batch_alter_table('course', schema=None) as batch_op:
        if 'overview' not in existing_course_columns:
            batch_op.add_column(sa.Column('overview', sa.Text(), nullable=True))
        if 'learning_outcomes' not in existing_course_columns:
            batch_op.add_column(sa.Column('learning_outcomes', sa.Text(), nullable=True))
        if 'prerequisites' not in existing_course_columns:
            batch_op.add_column(sa.Column('prerequisites', sa.Text(), nullable=True))
        if 'target_audience' not in existing_course_columns:
            batch_op.add_column(sa.Column('target_audience', sa.Text(), nullable=True))


def downgrade():
    # Remove columns from course table
    with op.batch_alter_table('course', schema=None) as batch_op:
        batch_op.drop_column('target_audience')
        batch_op.drop_column('prerequisites')
        batch_op.drop_column('learning_outcomes')
        batch_op.drop_column('overview')

    # Remove columns from course_material table
    with op.batch_alter_table('course_material', schema=None) as batch_op:
        batch_op.drop_constraint('fk_course_material_section_id', type_='foreignkey')
        batch_op.drop_column('description')
        batch_op.drop_column('section_id')

    # Drop course_section table
    op.drop_table('course_section')