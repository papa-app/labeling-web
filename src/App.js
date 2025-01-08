import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import Select from "react-select";
import { variedades } from "./categorias";
import "./App.css";

const App = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [drawingPoly, setDrawingPoly] = useState(false);
  const [polyCoords, setPolyCoords] = useState([]);
  const [variedad, setVariedad] = useState(variedades[0]);
  const [edadMin, setEdadMin] = useState("");
  const [edadMax, setEdadMax] = useState("");
  const [modalMsg, setModalMsg] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Google Maps loading hook
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    async function getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            });
          },
          (error) => {
            setErrorMsg("Error getting location: " + error.message);
          }
        );
      } else {
        setErrorMsg("Geolocation is not supported by this browser.");
      }
    }

    async function wakeUpServer() {
      try {
        await fetch("https://papapp-labeling.onrender.com/wakeup");
        setLoading(false);
      } catch (error) {
        setErrorMsg(error.message);
      }
    }

    wakeUpServer();
    getCurrentLocation();
  }, []);

  const handleMapClick = (event) => {
    if (drawingPoly) {
      setPolyCoords([
        ...polyCoords,
        {
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        },
      ]);
    }
  };

  const submitLabel = (coords, variedad, edadMin, edadMax) => {
    if (coords.length < 3) {
      setModalMsg(
        "Tiene que seleccionar mas puntos para delimitar correctamente un area"
      );
      setModalVisible(true);
      setPolyCoords([]);
      return;
    }
    const adaptedCoords = coords.map((coord) => [
      coord.latitude,
      coord.longitude,
    ]);
    const requestBody = {
      poly: adaptedCoords,
      variedad,
      edadMin: parseInt(edadMin),
      edadMax: parseInt(edadMax),
    };

    fetch("https://papapp-labeling.onrender.com/labeling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        setModalVisible(true);
        setModalMsg(JSON.stringify(data));
      })
      .catch((error) => {
        setErrorMsg(error.message);
      });
    setDrawingPoly(false);
    setPolyCoords([]);
  };

  if (errorMsg) {
    return (
      <div className="container">
        <p className="message">Error: {errorMsg}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <p className="message">
          Prendiendo el servidor, se puede demorar varios minutos...
        </p>
      </div>
    );
  }

  if (!isLoaded || !location) {
    return (
      <div className="container">
        <p className="message">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <GoogleMap
        mapContainerClassName="map"
        center={{
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }}
        zoom={15}
        onClick={handleMapClick}
        options={{ mapTypeId: "hybrid" }}
      >
        {polyCoords.map((coord, index) => (
          <Marker
            key={index}
            position={{
              lat: coord.latitude,
              lng: coord.longitude,
            }}
          />
        ))}

        {polyCoords.length > 2 && (
          <Polygon
            paths={polyCoords.map((coord) => ({
              lat: coord.latitude,
              lng: coord.longitude,
            }))}
            options={{
              fillColor: "rgba(0, 200, 0, 0.3)",
              strokeColor: "#000",
            }}
          />
        )}
      </GoogleMap>

      <div className="button-container">
        {!drawingPoly && (
          <button onClick={() => setDrawingPoly(true)}>
            Etiquetar cultivo
          </button>
        )}

        {drawingPoly && (
          <>
            <Select
              value={{ value: variedad, label: variedad }}
              onChange={(option) => setVariedad(option.value)}
              options={variedades.map((v) => ({ value: v, label: v }))}
              className="select"
            />
            <input
              type="number"
              className="input"
              onChange={(e) => setEdadMin(e.target.value)}
              value={edadMin}
              placeholder="Edad minima"
            />
            <input
              type="number"
              className="input"
              onChange={(e) => setEdadMax(e.target.value)}
              value={edadMax}
              placeholder="Edad maxima"
            />
            <button
              onClick={() => {
                setPolyCoords([]);
                setDrawingPoly(false);
              }}
            >
              Deshacer
            </button>
            <button
              onClick={() =>
                submitLabel(polyCoords, variedad, edadMin, edadMax)
              }
            >
              Enviar
            </button>
          </>
        )}
      </div>

      {modalVisible && (
        <div className="modal-backdrop" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>{modalMsg}</p>
            <button onClick={() => setModalVisible(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
