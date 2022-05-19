import React, { useState, useCallback, useRef } from "react";
import debounce from "lodash/debounce";

import "./App.css";

function App() {
  const [keyword, setKeyword] = useState("");
  const [content, setContent] = useState("");
  const mdictRef = useRef(null);

  const getMdictMethods = (deps) => {
    return new Promise((resolve, reject) => {
      try {
        window.requirejs([...deps], (...arg) => {
          resolve(arg);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const initMdict = async (fileList) => {
    try {
      const [mParser, mRenderer] = await getMdictMethods([
        "mdictParser",
        "mdictRenderer",
      ]);
      const resources = await mParser(fileList);
      const mdictRes = await mRenderer(resources);

      return mdictRes;
    } catch (error) {
      console.log(error);
    }
  };

  const handleDebounceSearch = async (keyword) => {
    const content = await mdictRef.current.lookup(keyword);
    setContent(content.html());
  };

  const debounceFn = useCallback(debounce(handleDebounceSearch, 300), []);

  const keywordChange = (e) => {
    const keywordVal = e?.target?.value || "";
    setKeyword(keywordVal);
    debounceFn(keywordVal);
  };

  return (
    <div className='App'>
      <input
        id='dictfile'
        type='file'
        multiple
        onChange={async (e) => {
          const mdict = await initMdict(e.target.files);
          mdictRef.current = mdict;
        }}
      />
      <input
        id='keyword'
        type='text'
        value={keyword}
        onChange={keywordChange}
      />
      <input id='btnLookup' type='button' value='look up' disabled='false' />
      <div id='definition' dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default App;
