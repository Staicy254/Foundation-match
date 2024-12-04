import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Header = () => {
    return (
        <nav className="navbar navbar-dark bg-primary">
            <div className="container">
                <a className="navbar-brand" href="/">
                    Foundation Shade Finder
                </a>
            </div>
        </nav>
    );
};

export default Header;
