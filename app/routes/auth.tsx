import { useEffect } from "react";
import { useNavigate } from "react-router";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Auth;
