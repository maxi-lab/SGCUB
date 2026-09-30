from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from .serializers import CambioPasswordSerializer, LoginSerializer, UsuarioActualSerializer


@extend_schema(tags=["Auth"])
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


@extend_schema(tags=["Auth"])
class RefreshView(TokenRefreshView):
    pass


@extend_schema(tags=["Auth"])
class LogoutView(TokenBlacklistView):
    pass


@extend_schema(tags=["Auth"], responses=UsuarioActualSerializer)
@api_view(["GET"])
def current_user(request):
    return Response(UsuarioActualSerializer(request.user).data)


@extend_schema(tags=["Auth"], request=CambioPasswordSerializer, responses={204: None})
@api_view(["POST"])
def change_password(request):
    serializer = CambioPasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save(update_fields=["password"])
    return Response(status=status.HTTP_204_NO_CONTENT)
