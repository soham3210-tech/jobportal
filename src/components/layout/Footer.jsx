import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faFacebook,
  faTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

import {
  faCircleInfo,
  faBriefcase,
  faNewspaper,
  faBuilding,
  faCircleQuestion,
  faShield,
  faUsers,
  faCookie,
  faLock,
  faFileContract,
  faUniversalAccess,
} from "@fortawesome/free-solid-svg-icons";



// Footer data
const footerLinks = {

  Company: [
    {
      name: "About Us",
      path: "/about",
      icon: faCircleInfo,
    },
    {
      name: "Careers",
      path: "/careers",
      icon: faBriefcase,
    },
    {
      name: "Blog",
      path: "/blog",
      icon: faNewspaper,
    },
    {
      name: "Press",
      path: "/press",
      icon: faBuilding,
    },
  ],


  Support: [
    {
      name: "Help Center",
      path: "/help",
      icon: faCircleQuestion,
    },
    {
      name: "Safety Center",
      path: "/safety",
      icon: faShield,
    },
    {
      name: "Community Guidelines",
      path: "/guidelines",
      icon: faUsers,
    },
  ],


  Legal: [
    {
      name: "Cookies Policy",
      path: "/cookies",
      icon: faCookie,
    },
    {
      name: "Privacy Policy",
      path: "/privacy",
      icon: faLock,
    },
    {
      name: "Terms of Service",
      path: "/terms",
      icon: faFileContract,
    },
    {
      name: "Accessibility",
      path: "/accessibility",
      icon: faUniversalAccess,
    },
  ],


  "Follow Us": [
    {
      name: "Facebook",
      path: "https://facebook.com",
      icon: faFacebook,
    },
    {
      name: "Twitter",
      path: "https://twitter.com",
      icon: faTwitter,
    },
    {
      name: "LinkedIn",
      path: "https://linkedin.com",
      icon: faLinkedin,
    },
  ],

};





const Footer = () => {


  return (

    <footer className="bg-gray-900 text-white">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">


          {
            Object.entries(footerLinks).map(([title, links]) => (

              <div key={title}>


                <h3 className="text-lg font-semibold mb-4">
                  {title}
                </h3>



                <ul className="space-y-3">


                  {
                    links.map((link) => (

                      <li key={link.name}>


                        <Link

                          to={link.path}

                          className="
                          flex items-center gap-3
                          text-gray-400
                          hover:text-white
                          transition-colors
                          "

                        >


                          <FontAwesomeIcon icon={link.icon} />


                          {link.name}


                        </Link>


                      </li>

                    ))
                  }


                </ul>


              </div>

            ))
          }


        </div>



        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">

          © {new Date().getFullYear()} JobWave. All rights reserved.

        </div>


      </div>


    </footer>

  );

};


export default Footer;