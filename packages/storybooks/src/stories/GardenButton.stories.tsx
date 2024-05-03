
import { GardenButton } from "./GardenButton";
import { useState } from "react";


export default {
    title:"real/GardenButton",
    component: GardenButton,

}



export const Primary = () => {
const [loading, setLoading] = useState(false);

  const handlegardenbuttonclick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 6000);
  }

    return (
        <div className="w-full">
        <GardenButton
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
        />
        
  
      </div>
)
}

export const secondary = () => {
    const [loading, setLoading] = useState(false);
    
      const handlegardenbuttonclick = () => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 6000);
      }
    
        return (
            <div className="w-full">
            <GardenButton
              text="Claim Rewards"
              variant="secondary"
              handleButtonClick={handlegardenbuttonclick}
              loading={loading}
              // loading
              // tooltip
              // tooltipPlace={"bottom"}
              // // tooltipClassName={"bg-red-500"}
              // tooltipText="Click to claim rewards"
              // tooltipClickedText="Rewards claimed!"
            />
            
      
          </div>
    )
    }