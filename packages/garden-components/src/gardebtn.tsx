// import React, { ReactNode, useContext, createContext, useState , FC, useEffect, useId,Dispatch,SetStateAction} from 'react';
// import { motion, useAnimation } from "framer-motion";
// import Lottie from "react-lottie-player";
// import GardenSpinner from "./garden_spinner.json";
// import { PlacesType, Tooltip } from "react-tooltip";

// type variant = "primary" | "secondary" | "green" | "disabled";

// const colors = {
//     primary: { bgColor: "#DB6A93", text: "#FFFFFF" },
//     secondary: { bgColor: "#F7CFDB", text: "#554B6A" },
//     green: { bgColor: "#C8F5E6", text: "#554B6A" },
//     disabled: { bgColor: "#E3E0EB", text: "#554B6A" },
//     loading: { bgColor: "#F7CFDB", text: "#817A90" },
// };

// interface GardenContextData {
   
//     text: string;
//     setText: Dispatch<SetStateAction<string>>;
//     variant: variant;
//     setvariant: Dispatch<SetStateAction<variant>>;
//     loading: boolean;
//     setloading: Dispatch<SetStateAction<boolean>>;
//     handlebuttonClick: () => void; 
//     controls: any; // It's better to define a more specific type than `any` if possible.
//     cursorStyle: string;
//     tooltipcontent: string;
//     settooltipcontent: Dispatch<SetStateAction<string>>;
//     tooltiptext: string;
//     settooltiptext: Dispatch<SetStateAction<string>>;
//     tooltipId: string;
//     settooltipId: Dispatch<SetStateAction<string>>;
//     waitingfunction: () => void; 
//     setwaitingfunction: Dispatch<SetStateAction<() => void>>;
    
// }

// // Initialize the context with defaults.
// const GardenContext = createContext<GardenContextData>({
//     text: '',
//     setText: () => {},
//     loading: false,
//     setloading: () => {},
//     handlebuttonClick: () => {},
//     controls: {}, 
//     cursorStyle: '',
//     tooltipcontent: '',
//     settooltipcontent: () => {},
//     tooltiptext: '',
//     settooltiptext: () => {},
//     tooltipId: '',
//     settooltipId: () => {},
//     waitingfunction: () => {},
//     setwaitingfunction: () => {},
//     variant: 'primary',
//     setvariant: () => {},
  
// });


// export const GardenButton: React.FC<{ children: ReactNode }> = ({ children }) => {

//     const [loading, setloading] = useState<boolean>(false); // default to true
//     // const [location, setLocation] = useState<string>('');
//     const controls = useAnimation();
//     const[variant, setvariant] = useState<variant>('primary');
//     const tooltipId = useId();
//     const [tooltipcontent, settooltipcontent] = useState<string>('');
//     const [tooltiptext, settooltiptext] = useState<string>('');
//     const [waitingfunction, setwaitingfunction] = useState<() => void>(() => {});
    
    

//     useEffect(() => {
//         controls.start({
//           backgroundColor: loading
//             ? colors.loading.bgColor
//             : colors[variant].bgColor,
//           color: loading ? colors.loading.text : colors[variant].text,
//           transition: { duration: 0.2 },
//         });
//       }, [loading, controls, variant]);

//     return (
//         <GardenContext.Provider value={{ loading, setloading,tooltipcontent, settooltipcontent, tooltiptext, settooltiptext, tooltipId, settooltipId }}>
//           {children}
//         </GardenContext.Provider>
//     );
// };
// interface TooltipProps {
//     tooltip?: boolean;                  
//     tooltipPlace?: PlacesType;          
//     tooltipClassName?: string;          
//     tooltipText?: string;              
//     tooltipClickedText?: string;     
// }
// export const TooltipComponent: React.FC<TooltipProps> = ({ 
//     tooltip, 
//     tooltipClassName, 
//     tooltipPlace, 
//     tooltipText 
// }) => {
//     const context = useContext(GardenContext);

//     if (!context) {
//         throw new Error('TooltipComponent must be used within a GardenProvider');
//     }

//     const { settooltipcontent, tooltipcontent, tooltipId } = context;

//     useEffect(() => {
//         if (tooltipText) {
//             settooltipcontent(tooltipText);
//         }
//     }, [tooltipText, settooltipcontent]);

//     return (
//         <>
//             {tooltip && (
//                 <div className={tooltipClassName || "default-tooltip-class"}>
//                     <Tooltip
//                         id={tooltipId}
//                         arrowColor="inherit"
//                         place={tooltipPlace}
//                         style={{
//                             zIndex: 100,
//                             backgroundColor: "inherit",
//                             maxWidth: "318px",
//                             borderRadius: "8px",
//                         }}
//                     >
//                         {tooltipcontent}
//                     </Tooltip>
//                 </div>
//             )}
//         </>
//     );
// };

// export const Text: React.FC<{ children: ReactNode }> = ({ children }) => {
//     const context = useContext(GardenContext);
//     const { setText } = context;
//     setText(children as string);
//     return (<></>)
// };


// interface LoaderProps {
//     loading: boolean;                    
//     waitingFunction: () => void;               
//     className?: string;                        
// }

// export const Loader: React.FC<LoaderProps> = ({ loading, waitingFunction, className }) => {
//     const context = useContext(GardenContext);
//     const { setloading, setwaitingfunction,controls,tooltipId,settooltipcontent,text,cursorStyle } = context;

//     if(waitingFunction){
//         setwaitingfunction(waitingFunction);
//     }
//     return (
//         <motion.button
//         className={`relative flex flex-row items-center gap-x-2 font-bold py-2 z-20 overflow-hidden outline-none focus:outline-none border-none ${cursorStyle} ${
//           loading ? "px-5" : "px-8"
//         } rounded-full ${className}`}
//         animate={controls}
//         // ref={ref}
//         onClick={handleClick}
//         data-tooltip-id={tooltipId}
//         onMouseEnter={() => setTooltipContent(tooltipText)}
//       >
//         {text}
//         {loading && (
//           <Lottie
//             className={`w-4 h-4`}
//             loop={true}
//             play={true}
//             animationData={GardenSpinner}
//           />
//         )}
//         {loading && (
//           <motion.div
//             className="absolute w-12 h-40 rotate-[30deg] -z-10 -left-12"
//             style={{
//               background:
//                 "linear-gradient(to right, rgba(255, 239, 244, 0), rgba(255, 239, 244, 1) 25%, rgba(255, 239, 244, 1) 75%, rgba(255, 239, 244, 0))",
//             }}
//             initial={{ left: -50 }}
//             animate={{ left: "110%" }}
//             transition={{
//               duration: 1,
//               repeat: Infinity,
//               repeatDelay: 1,
//               ease: [0.32, 0.94, 0.6, 1.0],
//               delay: 1,
//             }}
//           />
//         )}
//       </motion.button>
//     )
// };

// export default Object.assign(GardenButton, {
//     Tooltip,
//     Text,
// });
