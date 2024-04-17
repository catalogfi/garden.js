import "./App.css";
import "garden-components/dist/style.css";
import { useState } from "react";
import { GardenButton1 } from "garden-components";

function App() {
  const [loading, setLoading] = useState(false);

  const handlegardenbuttonclick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 6000);
  };

  return (
    <div className="w-full">
      {/* <GardenButton
        text="Claim Rewards"
        variant="primary"
        handleButtonClick={handlegardenbuttonclick}
        loading={loading}
        // loading
        // tooltip
        // tooltipPlace={"bottom"}
        // // tooltipClassName={"bg-red-500"}
        // tooltipText="Click to claim rewards"
        // tooltipClickedText="Rewards claimed!"
      /> */}
      <GardenButton1>
      <GardenButton1.tooltip tooltipClassName="bg-red-500"  tooltipText="Click to claim rewards"  tooltipClickedText="Rewards claimed!"  tooltipPlace="bottom"  tooltip={true}/>
      <GardenButton1.Text>Claim Reward</GardenButton1.Text>
      <GardenButton1.Loader  waitingFunction={handlegardenbuttonclick}  loading={loading}  className="primary"/>
      </GardenButton1>

    </div>
  );
}

export default App;
