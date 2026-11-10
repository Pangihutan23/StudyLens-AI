from datetime import datetime, timezone

from sqlalchemy import inspect

from ..utils.errors import AppError


def public(record, exclude=()):
    result = {}
    for column in inspect(record).mapper.column_attrs:
        key = column.key
        if key in exclude:
            continue
        value = getattr(record, key)
        if isinstance(value, datetime):
            value = value.replace(tzinfo=timezone.utc).isoformat()
        result[key] = value
    return result


def require(db, model, identifier):
    record = db.get(model, str(identifier))
    if record is None:
        raise AppError('The requested item was not found.', 404)
    return record


def ready_document(db, identifier):
    from ..models import Document
    document = require(db, Document, identifier)
    if document.status != 'ready':
        raise AppError('Choose a successfully indexed document first.', 409)
    return document
