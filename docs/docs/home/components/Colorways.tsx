import React from "react";

import mainColorway from "./../images/main_colorway.png";
import altColorway1 from "./../images/alt_colorway_1.png";
import altColorway2 from "./../images/alt_colorway_2.png";

const Colorways = () => {
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <div style={{ textAlign: "center" }}>
        <img
          src={mainColorway}
          alt="Main Colorway"
          style={{ width: "17rem" }}
        />
        <p style={{ fontWeight: "bold" }}>Main Colorway</p>
        <p>Background: #7BDCBA</p>
        <p>Gradient: #9BC8FF</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <img
          src={altColorway1}
          alt="Alt Colorway 1"
          style={{ width: "17rem" }}
        />
        <p style={{ fontWeight: "bold" }}>Alt Colorway 1</p>
        <p>Background: #8DCOFF</p>
        <p>Gradient: #FFBBD3</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <img
          src={altColorway2}
          alt="Alt Colorway 2"
          style={{ width: "17rem" }}
        />
        <p style={{ fontWeight: "bold" }}>Alt Colorway 2</p>
        <p>Background: #FCB9C2</p>
        <p>Gradient: #FDD79D</p>
      </div>
    </div>
  );
};

export default Colorways;
