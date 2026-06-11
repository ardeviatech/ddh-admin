import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import axiosInstance from "../../api/axiosInstance";
import { useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Shield } from "lucide-react";

// Validation schema
const loginSchema = yup.object({
  name: yup.string().required("Email is required"),
  password: yup
    .string()
    .min(4, "Password must be at least 4 characters")
    .required("Password is required"),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        username: data.name,
        password: data.password,
      });

      const { accessToken, user } = response.data.data;
      localStorage.setItem("authToken", accessToken);

      dispatch(setCredentials({ user, accessToken }));
      toast.success(`Welcome back, ${user.firstName || user.name}!`);
      navigate("/");
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Invalid credentials. Please try again.";

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH%20Yakap%2Fsmiling-asian-female-doctor-care-her-patients-shows-heart-gesture-looking-happy-standing.jpg?alt=media&token=a2ba19ac-6fde-44a7-8b6f-01c5b27234d7')`,
        }}
      />

      {/* Gradient Overlay for readability - DDH Green Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-teal-900/85 to-green-800/90" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header Section */}
        <div className="text-center mb-8">
          <div
            className="inline-block bg-gradient-to-br from-white via-green-50 to-teal-50 rounded-full p-1 shadow-2xl mb-6 animate-spin"
            style={{ animationDuration: "8s" }}
          >
            <div className="bg-white rounded-full p-0.5">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDDH_Logo-removebg-preview.png?alt=media&token=de7727c9-19c4-4d92-acf9-f4f8cbc51ab6"
                alt="DDH Logo"
                className="w-24 h-24 object-contain animate-spin"
                style={{
                  animationDuration: "8s",
                  animationDirection: "reverse",
                }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Dupax District Hospital
          </h1>
          <p className="text-green-50 text-sm font-medium drop-shadow-md">
            Yakap Healthcare Management System
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-4 h-4 text-green-100" />
            <span className="text-xs text-green-100 font-medium drop-shadow-md">
              PhilHealth Integrated
            </span>
          </div>
        </div>

        {/* Login Card - No Border Radius */}
        <div className="bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-teal-700 px-6 py-5">
            <h2 className="text-xl font-bold text-white text-center">
              Welcome Back
            </h2>
            <p className="text-green-100 text-sm text-center mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register("name")}
                    className={`w-full pl-12 pr-4 py-3 border focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder=""
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    {...register("password")}
                    className={`w-full pl-12 pr-4 py-3 border focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder=""
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-700 to-teal-700 hover:from-green-800 hover:to-teal-800 text-white font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <div className="rounded-xl border border-green-200/80 bg-green-50/80 p-4 text-sm text-green-800">
                <p className="font-semibold">Demo credentials</p>
                <p className="mt-2">
                  Use{" "}
                  <span className="font-medium">
                    admin@dupaxhospital.gov.ph
                  </span>{" "}
                  and <span className="font-medium">admin</span> to sign in.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-xs drop-shadow-md">
            Powered by Ardevia • Secure Healthcare Management
          </p>
          <p className="text-white/90 text-xs mt-2 font-medium drop-shadow-md">
            © 2026 Dupax District Hospital. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
