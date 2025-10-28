// src/components/LocationPickerMap.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, ImageOverlay, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Defina as dimensões da sua imagem do mapa (largura x altura em pixels)
const MAP_IMAGE_WIDTH = 8192;
const MAP_IMAGE_HEIGHT = 8192;

// Define os limites do mapa baseados nas dimensões da imagem
const bounds = new L.LatLngBounds(
    new L.LatLng(-MAP_IMAGE_HEIGHT, 0), // Canto inferior esquerdo
    new L.LatLng(0, MAP_IMAGE_WIDTH)     // Canto superior direito
);

// Ícone simples para o marcador
const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Componente interno para lidar com cliques no mapa
function LocationMarker({ initialPosition, onLocationSelect }) {
    const [position, setPosition] = useState(initialPosition ? L.latLng(initialPosition.y, initialPosition.x) : null);

    useEffect(() => {
        setPosition(initialPosition ? L.latLng(initialPosition.y, initialPosition.x) : null);
    }, [initialPosition]);

    const map = useMapEvents({
        click(e) {
            const latLng = e.latlng;
            // Converte coordenadas do Leaflet (Lat/Lng) para coordenadas da Imagem (Y/X)
            // latLng.lng é o X da imagem
            // -latLng.lat é o Y da imagem (pois o Y do Leaflet é negativo)
            const imageX = latLng.lng.toFixed(6);
            const imageY = (-latLng.lat).toFixed(6);
            
            // Garante que os valores não saiam dos limites da imagem
            const clampedX = Math.max(0, Math.min(MAP_IMAGE_WIDTH, imageX));
            const clampedY = Math.max(0, Math.min(MAP_IMAGE_HEIGHT, imageY));
            
            setPosition(latLng);
            onLocationSelect({ x: clampedX, y: clampedY });
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position]);

    return position === null ? null : (
        <Marker position={position} icon={markerIcon} />
    );
}

// Componente principal do seletor de localização
const LocationPickerMap = ({ initialCoords, onLocationSelect, readOnly = false }) => {
    // Converte coordenadas da Imagem (X, Y) para Leaflet (Lat, Lng)
    const initialLeafletPos = initialCoords?.x != null && initialCoords?.y != null
        ? { y: -initialCoords.y, x: initialCoords.x } // Leaflet Lat = -Y, Leaflet Lng = X
        : null;

    // Centro inicial: Se houver coordenadas, centraliza nelas, senão no meio da imagem
    const mapCenter = initialLeafletPos
        ? [initialLeafletPos.y, initialLeafletPos.x]
        : [-MAP_IMAGE_HEIGHT / 2, MAP_IMAGE_WIDTH / 2];

    return (
        <MapContainer
            center={mapCenter}
            zoom={0} 
            minZoom={-2}
            maxZoom={5}
            crs={L.CRS.Simple}
            style={{ height: '100%', width: '100%', backgroundColor: 'transparent', cursor: readOnly ? 'default' : 'crosshair' }}
            maxBounds={bounds}
            maxBoundsViscosity={1.0}
            zoomControl={true} // Mostra os botões +/-
        >
            <ImageOverlay
                url="/mapa_gta.png" // Certifique-se que está na pasta /public
                bounds={bounds}
            />
            {!readOnly && (
                <LocationMarker
                    initialPosition={initialLeafletPos}
                    onLocationSelect={onLocationSelect}
                />
            )}
            {readOnly && initialLeafletPos && (
                <Marker position={L.latLng(initialLeafletPos.y, initialLeafletPos.x)} icon={markerIcon} />
            )}
        </MapContainer>
    );
};

export default LocationPickerMap;