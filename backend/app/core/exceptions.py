from fastapi import HTTPException, status


def not_found_exception(entity_name: str = "Resource") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{entity_name} not found."
    )


def forbidden_exception(detail: str = "Insufficient permissions to perform this action.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail
    )


def conflict_exception(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail
    )


def validation_exception(detail: str) -> HTTPException:
    return HTTPException(
        status_code=422,
        detail=detail
    )


def bad_request_exception(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail
    )
