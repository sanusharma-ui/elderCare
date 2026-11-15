"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface RevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  distance = 32,
  className = "",
  once = true,
  ...props
}: RevealProps) {
  let initialX = 0;
  let initialY = 0;

  switch (direction) {
    case "up":
      initialY = distance; // Fade up from bottom
      break;
    case "down":
      initialY = -distance; // Fade down from top
      break;
    case "right":
      initialX = distance; // Slide in from right
      break;
    case "left":
      initialX = -distance; // Slide in from left
      break;
    case "none":
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
