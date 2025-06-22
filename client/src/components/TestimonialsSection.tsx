import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FaQuoteLeft, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

type Testimonial = {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Hannah Adeyemo",
    role: "Agricultural Consultant",
    content: "I recommend LeafDoctor to all my clients. The accuracy and speed of diagnosis allows for quick intervention, and the history tracking makes it easy to monitor trends across seasons. The developers clearly understand the needs of agricultural professionals.",
    rating: 5,
    avatar: "/hannah.jpeg"
  },
  {
    id: 2,
    name: "Rotimi Omojola",
    role: "Greenhouse Manager",
    content: "Managing a large commercial greenhouse comes with many challenges, but LeafDoctor has simplified disease management significantly. The offline capabilities are particularly valuable when working in areas with poor connectivity.",
    rating: 5,
    avatar: "/rotimi.jpeg?v=1"
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "Commercial Farmer",
    content: "LeafDoctor has transformed the way we monitor crop health on our farm. The AI diagnosis is incredibly accurate and has helped us catch and treat disease outbreaks before they spread. The voice assistant feature is especially helpful when I'm out in the field.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
  },
  {
    id: 4,
    name: "David Chen",
    role: "Home Gardener",
    content: "As a hobby gardener, I struggled to identify what was wrong with my plants. LeafDoctor has been a game-changer! The app is intuitive, and the treatment recommendations are practical and easy to follow. Worth every penny for the premium version.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6"
  }
];

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Check if section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds for more dynamic rotation
    
    // Reset autoplay after 5 seconds of manual navigation
    const timeoutId = setTimeout(() => {
      setAutoplay(true);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [autoplay]);

  const goToPrevious = () => {
    setAutoplay(false);
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setAutoplay(false);
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <div id="testimonials" className="py-10 sm:py-12 md:py-16 lg:py-20 bg-[#F8FCFA]" ref={sectionRef}>
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center bg-[#2ECC71]/10 px-4 py-2 rounded-full mb-3">
            <span className="text-[#2ECC71] font-semibold text-xs sm:text-sm">Trusted by Users</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">What Our Users Say</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
            Discover how LeafDoctor is helping professionals and enthusiasts around the world to diagnose and treat plant diseases
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Desktop view - all testimonials in grid */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </div>
          
          {/* Mobile/Tablet view - carousel */}
          <div className="lg:hidden">
            <div className="relative">
              {/* Navigation buttons */}
              <motion.button 
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-md hover:shadow-lg text-[#2ECC71] transition-all hover:bg-[#2ECC71]/10"
                aria-label="Previous testimonial"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
              
              <motion.button 
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-md hover:shadow-lg text-[#2ECC71] transition-all hover:bg-[#2ECC71]/10"
                aria-label="Next testimonial"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
              
              <div className="overflow-hidden mx-3 sm:mx-5">
                <motion.div 
                  className="flex transition-transform duration-500 ease-in-out" 
                  style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    // Calculate if drag was significant to switch testimonial
                    const swipeThreshold = 50;
                    if (offset.x < -swipeThreshold) {
                      goToNext();
                    } else if (offset.x > swipeThreshold) {
                      goToPrevious();
                    }
                  }}
                >
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="w-full flex-shrink-0 px-1 sm:px-2">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
            
            {/* Carousel indicators */}
            <div className="flex justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setActiveTestimonial(index);
                    setAutoplay(false);
                  }}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                    activeTestimonial === index 
                      ? "bg-[#2ECC71] scale-110" 
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 sm:mt-10 text-center"
        >
          <a 
            href="/auth?tab=register" 
            className="inline-flex items-center bg-[#2ECC71] hover:bg-[#27AE60] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
          >
            Join Our Growing Community
            <FaChevronRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all group">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden mr-3 sm:mr-4 transition-transform group-hover:scale-110 duration-300">
            <img 
              src={`${testimonial.avatar}?w=96&h=96&fit=crop&crop=faces`} 
              alt={testimonial.name} 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#2C3E50]">{testimonial.name}</h4>
            <p className="text-xs sm:text-sm text-gray-500">{testimonial.role}</p>
          </div>
        </div>
        
        <div className="mb-3 sm:mb-4 flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <FaStar 
              key={i} 
              className={`text-sm sm:text-base transform transition-transform group-hover:scale-110 duration-300 ${
                i < testimonial.rating ? "text-yellow-400" : "text-gray-200"
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        
        <div className="relative">
          <FaQuoteLeft className="absolute -top-2 -left-1 text-[#2ECC71]/20 text-base sm:text-xl transition-all group-hover:scale-125 group-hover:text-[#2ECC71]/30 duration-300" />
          <p className="text-gray-600 italic pl-4 sm:pl-6 text-xs sm:text-sm md:text-base">{testimonial.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}