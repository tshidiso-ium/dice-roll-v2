import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WindowSize from '../../modules/windowSize';
import { Label } from "../../components/ui/label";
import { cn } from '../utils/cn';
import logo from '../../images/dice-red.jpg';

const backdrop = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

function ModalProps() {
  const device = WindowSize();
  return {
    hidden: { y: "-100vh", opacity: 0 },
    visible: {
      y: `${'0px'}`,
      opacity: 1,
      transition: { delay: 0.2 }
    }
  };
}

function Icons({ icon }) {
  switch (icon) {
    case "approved":
      return (
        <svg
          className='absolute top-11 left-11'
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <path d="M256,0C114.833,0,0,114.833,0,256s114.833,256,256,256s256-114.853,256-256S397.167,0,256,0z M256,472.341
            c-119.275,0-216.341-97.046-216.341-216.341S136.725,39.659,256,39.659c119.295,0,216.341,97.046,216.341,216.341
            S375.275,472.341,256,472.341z" />
          <path d="M373.451,166.965c-8.071-7.337-20.623-6.762-27.999,1.348L224.491,301.509l-58.438-59.409
            c-7.714-7.813-20.246-7.932-28.039-0.238c-7.813,7.674-7.932,20.226-0.238,28.039l73.151,74.361
            c3.748,3.807,8.824,5.929,14.138,5.929c0.119,0,0.258,0,0.377,0.02c5.473-0.119,10.629-2.459,14.297-6.504l135.059-148.722
            C382.156,186.854,381.561,174.322,373.451,166.965z" />
        </svg>
      );
    case "warn":
      return (
        <svg
          className='absolute top-11 left-11'
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <path d="M256,0C114.497,0,0,114.507,0,256c0,141.503,114.507,256,256,256c141.503,0,256-114.507,256-256
            C512,114.497,397.493,0,256,0z M256,472c-119.393,0-216-96.615-216-216c0-119.393,96.615-216,216-216
            c119.393,0,216,96.615,216,216C472,375.393,375.385,472,256,472z" />
          <path d="M256,128.877c-11.046,0-20,8.954-20,20V277.67c0,11.046,8.954,20,20,20s20-8.954,20-20V148.877
            C276,137.831,267.046,128.877,256,128.877z" />
          <circle cx="256" cy="349.16" r="27" />
        </svg>
      );
    case "unapproved":
      return (
        <svg
          className='absolute top-11 left-11'
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <path d="M256,0C114.508,0,0,114.497,0,256c0,141.493,114.497,256,256,256c141.492,0,256-114.497,256-256
            C512,114.507,397.503,0,256,0z M256,472c-119.384,0-216-96.607-216-216c0-119.385,96.607-216,216-216
            c119.384,0,216,96.607,216,216C472,375.385,375.393,472,256,472z" />
          <path d="M343.586,315.302L284.284,256l59.302-59.302c7.81-7.81,7.811-20.473,0.001-28.284c-7.812-7.811-20.475-7.81-28.284,0
            L256,227.716l-59.303-59.302c-7.809-7.811-20.474-7.811-28.284,0c-7.81,7.811-7.81,20.474,0.001,28.284L227.716,256
            l-59.302,59.302c-7.811,7.811-7.812,20.474-0.001,28.284c7.813,7.812,20.476,7.809,28.284,0L256,284.284l59.303,59.302
            c7.808,7.81,20.473,7.811,28.284,0C351.398,335.775,351.397,323.112,343.586,315.302z" />
        </svg>
      );
    case "loading":
      return (
        <div className="p-4">
          <svg
            className='absolute top-11 left-11'
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 30"
            width="200px"
            height="200px"
            fill="White"
          >
            <circle cx="15" cy="15" r="15">
              <animate
                attributeName="r"
                from="15"
                to="15"
                begin="0s"
                dur="0.8s"
                values="15;9;15"
                calcMode="linear"
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill-opacity"
                from="1"
                to="1"
                begin="0s"
                dur="0.8s"
                values="1;.5;1"
                calcMode="linear"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="60" cy="15" r="9" fillOpacity="0.3">
              <animate
                attributeName="r"
                from="9"
                to="9"
                begin="0s"
                dur="0.8s"
                values="9;15;9"
                calcMode="linear"
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill-opacity"
                from="0.5"
                to="0.5"
                begin="0s"
                dur="0.8s"
                values=".5;1;.5"
                calcMode="linear"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="105" cy="15" r="15">
              <animate
                attributeName="r"
                from="15"
                to="15"
                begin="0s"
                dur="0.8s"
                values="15;9;15"
                calcMode="linear"
                repeatCount="indefinite"
              />
              <animate
                attributeName="fill-opacity"
                from="1"
                to="1"
                begin="0s"
                dur="0.8s"
                values="1;.5;1"
                calcMode="linear"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      );
    default:
      throw new Error("invalid icon {" + icon + ") for popup.");
  }
}

const RegistrationSuccessful = ({ modalState }) => {
  const modal = ModalProps();

  const handleCancel = () => {
  };

  return (
    <AnimatePresence>
      {modalState.showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="relative w-full max-w-[900px] border-[3px] border-yellow-400 rounded-xl shadow-xl overflow-hidden p-6"
            style={{
              backgroundImage: `linear-gradient(to top, #1c1c1c, #4a0000), radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 70%)`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
            }}
            variants={modal}
          >
            {/* Optional icon */}
            {/* {modalState.icon && <Icons icon={modalState.icon} />} */}

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-yellow-400 text-2xl font-bold hover:text-red-500 transition-all z-50"
              onClick={handleCancel}
            >
              ✕
            </button>

            {/* Modal content */}
            <div className="z-10 relative backdrop-blur-sm p-4">
              <h2 className="text-center text-3xl font-extrabold text-yellow-400 drop-shadow-md font-mono">
                {'REGISTRATION SUCCESSFUL!'}
              </h2>

              <LabelInputContainer className="mt-6">
                <Label
                  htmlFor="options"
                  className="text-center block text-lg text-white font-mono mb-2"
                >
                    {"Now verify your email by clicking the link we just sent your inbox."}
                </Label>
              </LabelInputContainer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};

export default RegistrationSuccessful;
