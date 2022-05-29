import React, { useState, useCallback, useRef } from "react";
import MacButton from "./component/MacButton";
import debounce from "lodash/debounce";
import { appWindow } from "@tauri-apps/api/window";
import dictionary from "./common/mdictModule";

import styles from "./App.module.scss";

function App() {
  const [keyword, setKeyword] = useState("");
  const [content, setContent] = useState("");
  const [searchList, setSearchList] = useState([]);
  const mdictRef = useRef(null);

  const initMdict = async (fileList) => {
    try {
      const mdictRes = await dictionary(fileList);
      return mdictRes;
    } catch (error) {
      console.error(error);
    }
  };

  const handleDebounceSearch = async (keywords) => {
    const searchRes = await mdictRef.current.search({
      phrase: keywords,
      max: 50,
    });

    const searchResList = searchRes
      .filter((it) => !/\_|\-/g.test(it))
      .map((v) => ({
        word: v.toString(),
        value: v.offset,
      }));
    setSearchList(searchResList);
    handleSearchItem(searchResList[0].word);
  };

  const debounceFn = useCallback(debounce(handleDebounceSearch, 300), []);

  const handleSearchItem = async (word) => {
    const content = await mdictRef.current.lookup(word);
    setContent(content);
  };

  const keywordChange = (e) => {
    const keywordVal = e?.target?.value || "";
    setKeyword(keywordVal);
    if (!keywordVal.length) {
      setContent("");
      setSearchList([]);
      return;
    }
    debounceFn(keywordVal);
  };

  return (
    <div className={styles.mdictApp}>
      <div className={styles.topRightbButton}>
        <MacButton type={"close-btn"} onClick={() => appWindow.close()} />
        <MacButton type={"min-btn"} onClick={() => appWindow.minimize()} />
        <MacButton
          type={"max-btn"}
          onClick={() => appWindow.toggleMaximize()}
        />
      </div>
      <div className={styles.mdictHeader} data-tauri-drag-region>
        <input
          className={styles.search}
          type='text'
          value={keyword}
          placeholder='搜索'
          onChange={keywordChange}
        />
        <input
          id='dictfile'
          type='file'
          multiple
          placeholder='选择词典'
          onChange={async (e) => {
            const mdict = await initMdict(e.target.files);
            mdictRef.current = mdict;
          }}
        />
      </div>
      <div className={styles.mdictBody}>
        <ul className={styles.searchList}>
          {searchList.map((it) => (
            <li
              key={it.value}
              data-offset={it.value}
              onClick={() => handleSearchItem(it.word)}
            >
              {it.word}
            </li>
          ))}
        </ul>
        <div
          className={styles.mdictContent}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

export default App;
