from rest_framework import serializers
from .models import TipoDocumento, EstadoDocumento, Documento

class TipoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumento
        fields = '__all__'

class EstadoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoDocumento
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    persona_nombre_completo = serializers.SerializerMethodField()
    persona_es_activo = serializers.SerializerMethodField()
    categoria_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = '__all__'

    def get_persona_nombre_completo(self, obj):
        return f"{obj.persona.nombre} {obj.persona.apellido}"

    def get_persona_es_activo(self, obj):
        persona = obj.persona
        is_active = False
        if hasattr(persona, 'socio') and hasattr(persona.socio, 'jugador'):
            if persona.socio.jugador.estado and persona.socio.jugador.estado.nombre == 'Activo':
                is_active = True
        elif hasattr(persona, 'socio'):
            if persona.socio.estado_administrativo and persona.socio.estado_administrativo.nombre == 'Activo':
                is_active = True
                
        if hasattr(persona, 'docente'):
            if persona.docente.estado and persona.docente.estado.nombre == 'Activo':
                is_active = True
                
        return is_active

    def get_categoria_nombre(self, obj):
        persona = obj.persona
        if hasattr(persona, 'socio') and hasattr(persona.socio, 'jugador'):
            jugador = persona.socio.jugador
            if jugador.categoria:
                return jugador.categoria.nombre
            return 'Jugador'
        if hasattr(persona, 'docente'):
            return 'Docente'
        return 'Socio'
