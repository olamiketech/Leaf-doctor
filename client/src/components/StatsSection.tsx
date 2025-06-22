import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Coffee, Users, Award, Globe } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  endValue: number;
  suffix?: string;
  label: string;
  delay: number;
  inView: boolean;
}

const StatItem = ({ icon, value, endValue, suffix = "", label, delay, inView }: StatItemProps) => {
  const [currentValue, setCurrentValue] = useState(0);

  // Animation for counting up
  useEffect(() => {
    if (!inView) return;
    
    const timer = setTimeout(() => {
      if (currentValue < endValue) {
        const increment = Math.ceil(endValue / 30); // Adjust for animation speed
        const newValue = Math.min(currentValue + increment, endValue);
        setCurrentValue(newValue);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [currentValue, endValue, inView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <div className="bg-[#2ECC71]/10 p-4 rounded-full mb-4 text-[#2ECC71]">
        {icon}
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-1">
        {currentValue.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-500 text-center">{label}</div>
    </motion.div>
  );
};

export default function StatsSection() {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  const stats = [
    { 
      icon: <Coffee className="h-6 w-6" />, 
      endValue: 50000, 
      label: "Plant Diagnoses", 
      delay: 0 
    },
    { 
      icon: <Award className="h-6 w-6" />, 
      endValue: 1500, 
      label: "Plant Species", 
      delay: 0.1 
    },
    { 
      icon: <Users className="h-6 w-6" />, 
      endValue: 10000, 
      suffix: "+", 
      label: "Active Users", 
      delay: 0.2 
    },
    { 
      icon: <Globe className="h-6 w-6" />, 
      endValue: 45, 
      label: "Countries", 
      delay: 0.3 
    }
  ];

  return (
    <div ref={ref} className="py-12 bg-[#F8FCFA]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">LeafDoctor by the Numbers</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Making a global impact in plant health management
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={0}
              endValue={stat.endValue}
              suffix={stat.suffix}
              label={stat.label}
              delay={stat.delay}
              inView={isInView}
            />
          ))}
        </div>
      </div>
    </div>
  );
}