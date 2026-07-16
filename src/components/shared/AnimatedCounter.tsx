"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({ value, className, decimals = 0 }: AnimatedCounterProps) {
  const spring = useSpring(value, { stiffness: 75, damping: 15, mass: 0.5 });
  const display = useTransform(spring, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={cn("tabular-nums", className)} layout>
      {display}
    </motion.span>
  );
}
