import logging
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def production_exception_handler(exc, context):
    """
    Production-ready REST Framework exception handler.
    Guarantees:
    1. Standard DRF validation errors (400, 401, 403, 404) are preserved.
    2. Unhandled 500 exceptions are logged with full traceback on the server.
    3. In production (DEBUG=False), client receives a sanitized error message
       with zero database queries, passwords, file paths, or stack traces exposed.
    """
    response = exception_handler(exc, context)

    if response is not None:
        return response

    view = context.get('view')
    view_name = view.__class__.__name__ if view else 'UnknownView'
    logger.exception(f"Unhandled Server Error in {view_name}: {exc}")

    if not settings.DEBUG:
        return Response(
            {
                "error": "An unexpected internal server error occurred. The technical team has been notified.",
                "status_code": 500
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {
            "error": str(exc),
            "exception_type": exc.__class__.__name__,
            "status_code": 500
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
