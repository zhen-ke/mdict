import React from "react";
import styles from "./index.module.scss";

const MacButton = ({ type = "", ...props }) => {
  return <div className={`${styles.btn} ${styles[type]}`} {...props}></div>;
};

export default MacButton;
