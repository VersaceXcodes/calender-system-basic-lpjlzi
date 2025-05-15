import React from "react";
import { Link } from "react-router-dom";

const GV_Footer: React.FC = () => {
  // Static footer links based on the datamap default state.
  const footerLinks = [
    { title: "Contact", url: "https://picsum.photos/200" },
    { title: "Help", url: "https://picsum.photos/200" },
    { title: "Legal", url: "https://picsum.photos/200" }
  ];

  return (
    <>
      <footer className="bg-gray-200 text-gray-700 py-4">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="mb-2">
            {footerLinks.map((link, index) =>
              // If the URL is an internal route (starts with "/"), use the Link component.
              // Otherwise, render a standard anchor tag opening in a new tab.
              link.url.startsWith("/") ? (
                <Link key={index} to={link.url} className="mx-2 hover:underline">
                  {link.title}
                </Link>
              ) : (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-2 hover:underline"
                >
                  {link.title}
                </a>
              )
            )}
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Calendar System Basic. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;