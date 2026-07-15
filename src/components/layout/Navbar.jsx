import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faBuilding,
  faBook,
  faFile,
  faHouse,
  faRightFromBracket,
  faRightToBracket,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";


const navLinks = [
  {
    name: "Find Jobs",
    path: "/jobs",
    icon: faBriefcase,
  },
  {
    name: "Companies",
    path: "/companies",
    icon: faBuilding,
  },
  {
    name: "Resources",
    path: "/resources",
    icon: faBook,
  },
  {
    name: "Resume Builder",
    path: "/resume-builder",
    icon: faFile,
  },
];






const Navbar = () => {

  // Temporary auth for testing
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);



  useEffect(() => {

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);

  }, []);



  return (

    <motion.nav

      initial={{ y: -100 }}

      animate={{ y: 0 }}

      className={`
      fixed top-0 w-full z-50 transition-all duration-300
      ${isScrolled
          ? "bg-white shadow-lg"
          : "bg-white/90 backdrop-blur-md"}
      `}

    >


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        <div className="flex justify-between items-center h-20">


          {/* LOGO */}

          <Link to="/">

            <motion.div

              initial={{ opacity: 0, scale: .5 }}

              animate={{ opacity: 1, scale: 1 }}

              className="flex items-center"

            >

              <span className="
              text-3xl font-extrabold
              bg-gradient-to-r from-purple-600 to-indigo-600
              bg-clip-text text-transparent
              ">
                Job
              </span>


              <span className="
              text-3xl font-extrabold text-gray-900
              ">
                Wave
              </span>

            </motion.div>

          </Link>




          {/* DESKTOP NAV */}

          <div className="hidden md:flex gap-2">

            {
              navLinks.map(link => (

                <Link

                  key={link.name}

                  to={link.path}

                  className={`
                  relative flex items-center gap-2
                  px-4 py-2 rounded-lg
                  text-sm font-medium
                  transition

                  ${location.pathname === link.path
                      ?
                      "text-indigo-600 bg-indigo-50"
                      :
                      "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                    }
                  `}

                >

                  <FontAwesomeIcon icon={link.icon} />

                  {link.name}


                  {
                    location.pathname === link.path &&

                    <motion.span

                      layoutId="active"

                      className="
                      absolute bottom-0 left-0 right-0
                      h-0.5 bg-indigo-600
                      "

                    />

                  }


                </Link>

              ))
            }

          </div>





          {/* AUTH */}

          <div className="hidden md:flex items-center gap-3">


            {
              user ?


                <>


                  <Link

                    to="/dashboard"

                    className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                hover:bg-gray-100
                "

                  >

                    <FontAwesomeIcon icon={faHouse} />

                    Dashboard

                  </Link>


                  <button

                    onClick={logout}

                    className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                text-white
                bg-gradient-to-r
                from-purple-600 to-indigo-600
                hover:scale-105 transition
                "

                  >

                    <FontAwesomeIcon icon={faRightFromBracket} />

                    Logout

                  </button>


                </>



                :


                <>


                  <Link

                    to="/login"

                    className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                hover:bg-gray-100
                "

                  >

                    <FontAwesomeIcon icon={faRightToBracket} />

                    Login

                  </Link>


                  <Link

                    to="/register"

                    className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                text-white
                bg-gradient-to-r
                from-purple-600 to-indigo-600
                "

                  >

                    <FontAwesomeIcon icon={faUserPlus} />

                    Register

                  </Link>


                </>

            }


          </div>




          {/* MOBILE BUTTON */}

          <button

            className="md:hidden text-xl"

            onClick={() => setMobileOpen(!mobileOpen)}

          >

            {mobileOpen ? "✕" : "☰"}

          </button>


        </div>


      </div>






      {/* MOBILE MENU */}

      <AnimatePresence>

        {
          mobileOpen &&

          <motion.div

            initial={{
              height: 0,
              opacity: 0
            }}

            animate={{
              height: "auto",
              opacity: 1
            }}

            exit={{
              height: 0,
              opacity: 0
            }}

            className="
          md:hidden
          bg-white
          shadow-lg
          border-t
          "

          >


            <div className="p-4 space-y-2">


              {
                navLinks.map(link => (

                  <Link

                    key={link.name}

                    to={link.path}

                    onClick={() => setMobileOpen(false)}

                    className="
                flex items-center gap-3
                px-3 py-2
                rounded-lg
                hover:bg-gray-100
                "

                  >

                    <FontAwesomeIcon icon={link.icon} />

                    {link.name}


                  </Link>

                ))
              }





              {
                user ?

                  <button

                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}

                    className="
            flex items-center gap-3
            px-3 py-2
            w-full
            rounded-lg
            hover:bg-gray-100
            "

                  >

                    <FontAwesomeIcon icon={faRightFromBracket} />

                    Logout

                  </button>


                  :

                  <>


                    <Link

                      to="/login"

                      className="
            flex items-center gap-3
            px-3 py-2
            rounded-lg
            hover:bg-gray-100
            "

                    >

                      <FontAwesomeIcon icon={faRightToBracket} />

                      Login

                    </Link>



                    <Link

                      to="/register"

                      className="
            flex items-center gap-3
            px-3 py-2
            rounded-lg
            hover:bg-gray-100
            "

                    >

                      <FontAwesomeIcon icon={faUserPlus} />

                      Register

                    </Link>


                  </>

              }



            </div>


          </motion.div>
        }

      </AnimatePresence>


    </motion.nav>

  );
};



export default Navbar;