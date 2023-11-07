import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';

function App() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    axios.get('/api/get_all_restaurants/')
      .then(response => {
        setRestaurants(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the restaurants:', error);
      });
  }, []);

  return (
    <div className="App">
      {}
      <MapComponent restaurants={restaurants} />
      {}
    </div>
  );
}

export default App;
