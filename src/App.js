import logo from "./logo.svg";
import "./App.css";
import { dialog } from "@tauri-apps/api";

function App() {
  return (
    <div className='App'>
      <p
        onClick={async (e) => {
          const filePath = await dialog.open({
            title: "请选择文件",
          });
          if (!filePath) {
            return;
          }
          console.log(filePath);
        }}
      >
        123
      </p>
    </div>
  );
}

export default App;
