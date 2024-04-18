import { useContext, createContext, useState, useEffect, useId, Dispatch, SetStateAction, FC, ReactNode } from 'react';
import { motion, useAnimation } from "framer-motion";
import Lottie from "react-lottie-player";
import GardenSpinner from "./garden_spinner.json";
import { PlacesType, Tooltip } from "react-tooltip";

type Variant = "primary" | "secondary" | "green" | "disabled";

const colors = {
    primary: { bgColor: "#DB6A93", text: "#FFFFFF" },
    secondary: { bgColor: "#F7CFDB", text: "#554B6A" },
    green: { bgColor: "#C8F5E6", text: "#554B6A" },
    disabled: { bgColor: "#E3E0EB", text: "#554B6A" },
    loading: { bgColor: "#F7CFDB", text: "#817A90" },
};

interface GardenContextData {
    text: string;
    setText: Dispatch<SetStateAction<string>>;
    variant: Variant;
    setVariant: Dispatch<SetStateAction<Variant>>;
    loading: boolean;
    setloading: Dispatch<SetStateAction<boolean>>;
    handleButtonClick: () => void;
    controls: any;
    cursorStyle: string;
    setcursorStyle: Dispatch<SetStateAction<string>>;
    tooltipContent: string;
    setTooltipContent: Dispatch<SetStateAction<string>>;
    tooltipText: string;
    setTooltipText: Dispatch<SetStateAction<string>>;
    tooltipId: string;
    setTooltipId: Dispatch<SetStateAction<string>>;
    waitingFunction: () => void;
    setWaitingFunction: Dispatch<SetStateAction<() => void>>;
    tooltipClickedText: string;
    setTooltipClickedText: Dispatch<SetStateAction<string>>;
}

// Initialize the context with defaults

const GardenContext = createContext<GardenContextData>({
    text: '',
    setText: () => { },
    loading: false,
    setloading: () => { },
    handleButtonClick: () => { },
    controls: {},
    cursorStyle: '',
    setcursorStyle: () => { },
    tooltipContent: '',
    setTooltipContent: () => { },
    tooltipText: '',
    setTooltipText: () => { },
    tooltipId: '',
    setTooltipId: () => { },
    waitingFunction: () => { },
    setWaitingFunction: () => { },
    variant: 'primary',
    setVariant: () => { },
    tooltipClickedText: '',
    setTooltipClickedText: () => { },
});
export const GardenButton1 = ({ children }: { children: ReactNode }) => {
    const [loading, setloading] = useState<boolean>(false);
    const controls = useAnimation();
    const [variant, setVariant] = useState<Variant>('primary');
    const [tooltipContent, setTooltipContent] = useState<string>('');
    const [tooltipText, setTooltipText] = useState<string>('');
    const [waitingFunction, setWaitingFunction] = useState<() => void>(() => { });
    const [cursorStyle, setCursorStyle] = useState<string>('');
    const [text, setText] = useState<string>('');
    const tooltipId = useId();

    // Correctly use useEffect to handle side effects
    useEffect(() => {
        setCursorStyle(loading || variant === "disabled" ? "cursor-not-allowed" : "cursor-pointer");
    }, [loading, variant]);

    useEffect(() => {
        controls.start({
            backgroundColor: loading ? colors.loading.bgColor : colors[variant].bgColor,
            color: loading ? colors.loading.text : colors[variant].text,
            transition: { duration: 0.2 },
        });
    }, [loading, variant]);

    const handleHoverStart = () => {
        setCursorStyle(cursorStyle); 
      };

      // Function to handle hover end
      const handleHoverEnd = () => {
        setCursorStyle(cursorStyle);
      };

    return (
        <motion.div className='garden' onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        style={{ cursor: cursorStyle }}>
            <GardenContext.Provider value={{
                text, setText, loading, setloading, tooltipContent, setTooltipContent,
                tooltipText, setTooltipText, tooltipId, variant, setVariant, controls, cursorStyle, setcursorStyle: () => { },
                waitingFunction, setWaitingFunction, tooltipClickedText: '', setTooltipClickedText: () => { },
                handleButtonClick: () => { },
                setTooltipId: () => { },
            }}>
                {children}
            </GardenContext.Provider>

        </motion.div>
    );
};


interface TooltipProps {
    tooltip?: boolean;
    tooltipPlace?: PlacesType;
    tooltipClassName?: string;
    tooltipText?: string;
    tooltipClickedText?: string;
}
export const tooltip: FC<TooltipProps> = ({
    tooltip,
    tooltipClassName,
    tooltipPlace,
    tooltipText
}) => {
    const context = useContext(GardenContext);

    if (!context) {
        throw new Error('TooltipComponent must be used within a GardenProvider');
    }

    const { setTooltipContent, tooltipContent, tooltipId } = context;

    useEffect(() => {
        if (tooltipText) {
            setTooltipContent(tooltipText);
        }
    }, [tooltipText, setTooltipContent]);


    return (
        <>
            {tooltip && (
                <div className={tooltipClassName || "default-tooltip-class"}>
                    <Tooltip
                        id={tooltipId}
                        arrowColor="inherit"
                        place={tooltipPlace}
                        style={{
                            zIndex: 100,
                            backgroundColor: "inherit",
                            maxWidth: "318px",
                            borderRadius: "8px",
                        }}
                    >
                        {tooltipContent}
                    </Tooltip>
                </div>
            )}
        </>
    );
};

export const Text: FC<{ children: ReactNode }> = ({ children }) => {
    const context = useContext(GardenContext);
    const { setText } = context;
    setText(children as string);
    return (<></>)
};


interface LoaderProps {
    loading: boolean;
    waitingFunction: () => void;
    className?: string;
}

export const Loader: FC<LoaderProps> = ({ loading, waitingFunction, className }) => {
    const context = useContext(GardenContext);
    const {controls, tooltipId, setTooltipContent, text, cursorStyle, variant, tooltipClickedText ,setcursorStyle} = context;
    const handleClick = async () => {

        if (!loading && variant !== "disabled") {
            await controls.start({ scale: 0.97 });
            controls.start({ scale: 1 });
            setcursorStyle('cursor-not-allowed');
            // setVariant('secondary');

        }
        if (tooltipClickedText) {
            setTooltipContent(tooltipClickedText);
        }
        if (waitingFunction) {
            await waitingFunction();
        }

        // controls.stop();

        // setVariant('primary');
    };

    return (

        <motion.button
            className={`relative flex flex-row items-center gap-x-2 font-bold py-2 z-20 overflow-hidden outline-none focus:outline-none border-none ${cursorStyle} ${loading ? "px-5" : "px-8"
                } rounded-full ${className} inline-block`}
            animate={controls}
            onClick={handleClick}
            data-tooltip-id={tooltipId}
            onMouseEnter={() => setTooltipContent(text)}
            style={{ cursor: cursorStyle, position: 'relative' }}
        >
            <div className='inline-block'>{text}</div>

            <div className='inline-block'>
                {loading && (
                    <Lottie
                        className={`w-6 h-6`}
                        loop={true}
                        play={true}
                        animationData={GardenSpinner}
                    />
                )}

            </div>

            {loading && (
                <>
                    <motion.div
                        className="absolute w-12 h-40 rotate-[30deg] -z-10 -left-12"
                        style={{
                            background:
                                "linear-gradient(to right, rgba(255, 239, 244, 0), rgba(255, 239, 244, 1) 25%, rgba(255, 239, 244, 1) 75%, rgba(255, 239, 244, 0))",
                        }}
                        initial={{ left: -50 }}
                        animate={{ left: "110%" }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: [0.32, 0.94, 0.6, 1.0],
                            delay: 1,
                        }}
                    />
                </>
            )}
        </motion.button>
    )
};

GardenButton1.Text = Text;
GardenButton1.Loader = Loader;
GardenButton1.tooltip = tooltip;

export default GardenButton1