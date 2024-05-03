import { motion, useAnimation } from "framer-motion";
import { FC, useEffect, useId, useState } from "react";
import Lottie from "react-lottie-player";
import GardenSpinner from "./garden_spinner.json";
import { PlacesType, Tooltip } from "react-tooltip";

type ButtonVariant = "primary" | "secondary" | "green" | "disabled";

const colors = {
  primary: { bgColor: "#DB6A93", text: "#FFFFFF" },
  secondary: { bgColor: "#F7CFDB", text: "#554B6A" },
  green: { bgColor: "#C8F5E6", text: "#554B6A" },
  disabled: { bgColor: "#E3E0EB", text: "#554B6A" },
  loading: { bgColor: "#F7CFDB", text: "#817A90" },
};

type GardenButtonProps = {
  text: string;
  loading?: boolean;
  className?: string;
  handleButtonClick?: (...args: unknown[]) => void | Promise<void>;
  variant: ButtonVariant;
  ref?: React.Ref<HTMLButtonElement>;
  tooltip?: boolean;
  tooltipPlace?: PlacesType;
  tooltipClassName?: string;
  tooltipText?: string;
  tooltipClickedText?: string;
};

export const GardenButton: FC<GardenButtonProps> = ({
  text,
  loading,
  handleButtonClick,
  className,
  variant = "primary",
  tooltip,
  tooltipPlace,
  tooltipClassName,
  tooltipText,
  tooltipClickedText,
  ref,
}) => {
  const [tooltipContent, setTooltipContent] = useState(tooltipText);

  const controls = useAnimation();
  const tooltipId = useId();

  const cursorStyle =
    loading || variant === "disabled"
      ? "cursor-not-allowed"
      : handleButtonClick
      ? "cursor-pointer"
      : "cursor-default";

  useEffect(() => {
    controls.start({
      backgroundColor: loading
        ? colors.loading.bgColor
        : colors[variant].bgColor,
      color: loading ? colors.loading.text : colors[variant].text,
      transition: { duration: 0.2 },
    });
  }, [loading, controls, variant]);

  const handleClick = async () => {
    if (!loading && variant !== "disabled") {
      await controls.start({ scale: 0.97 });
      controls.start({ scale: 1 });
    }
    if (tooltipClickedText) {
      setTooltipContent(tooltipClickedText);
    }
    if (handleButtonClick) {
      await handleButtonClick();
    }
  };

  return (
    <div className="garden">
      {tooltip && (
        <div className={tooltipClassName ?? "bg-black"}>
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
      <motion.button
        className={`relative flex flex-row items-center gap-x-2 font-bold py-2 z-20 overflow-hidden outline-none focus:outline-none border-none ${cursorStyle} ${
          loading ? "px-5" : "px-8"
        } rounded-full ${className}`}
        animate={controls}
        ref={ref}
        onClick={handleClick}
        data-tooltip-id={tooltipId}
        onMouseEnter={() => setTooltipContent(tooltipText)}
      >
        {text}
        {loading && (
          <Lottie
            className={`w-4 h-4`}
            loop={true}
            play={true}
            animationData={GardenSpinner}
          />
        )}
        {loading && (
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
        )}
      </motion.button>
    </div>
  );
};
