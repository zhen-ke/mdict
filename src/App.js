import React, { useEffect } from "react";
import "./App.css";
import { dialog } from "@tauri-apps/api";
import Helmet from "react-helmet";

function App() {
  return (
    <div className='App'>
      <input id='dictfile' type='file' multiple />
      <input id='word' type='text' value='operation' />
      <input id='btnLookup' type='button' value='look up' disabled='false' />
      <div id='dict-title' />
      <div id='definition' />
      <Helmet>
        <script src={process.env.PUBLIC_URL + "/static/js/conf.js"}></script>
        <script
          src={process.env.PUBLIC_URL + "/static/js/require.js"}
          data-main={process.env.PUBLIC_URL + "/static/js/mdict.js"}
        ></script>
      </Helmet>
    </div>
  );
}

export default App;
