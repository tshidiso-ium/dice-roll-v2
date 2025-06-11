import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WindowSize from '@/app/modules/windowSize';


const backdrop = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}


function ModalProps () {
  const device = WindowSize();
  console.log('device width: ', device.width);
  return {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { 
      y: `${device.width < 1540 ? '250px' : '550px' }`, 
      opacity: 1,
      transition: { delay: 0.2 }
    }
  }
}

function Icons({ icon }) {
  switch (icon) {
    case "approved":
      return (
        <svg
          className='absolute top-11 left-11'
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <g>
            <g>
              <path
                d="M256,0C114.833,0,0,114.833,0,256s114.833,256,256,256s256-114.853,256-256S397.167,0,256,0z M256,472.341
			c-119.275,0-216.341-97.046-216.341-216.341S136.725,39.659,256,39.659c119.295,0,216.341,97.046,216.341,216.341
			S375.275,472.341,256,472.341z"
              />
            </g>
          </g>
          <g>
            <g>
              <path
                d="M373.451,166.965c-8.071-7.337-20.623-6.762-27.999,1.348L224.491,301.509l-58.438-59.409
			c-7.714-7.813-20.246-7.932-28.039-0.238c-7.813,7.674-7.932,20.226-0.238,28.039l73.151,74.361
			c3.748,3.807,8.824,5.929,14.138,5.929c0.119,0,0.258,0,0.377,0.02c5.473-0.119,10.629-2.459,14.297-6.504l135.059-148.722
			C382.156,186.854,381.561,174.322,373.451,166.965z"
              />
            </g>
          </g>
        </svg>
      );
    case "warn":
      return (
        <svg
          className='absolute top-11 left-11'
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <g>
            <g>
              <path
                d="M256,0C114.497,0,0,114.507,0,256c0,141.503,114.507,256,256,256c141.503,0,256-114.507,256-256
			C512,114.497,397.493,0,256,0z M256,472c-119.393,0-216-96.615-216-216c0-119.393,96.615-216,216-216
			c119.393,0,216,96.615,216,216C472,375.393,375.385,472,256,472z"
              />
            </g>
          </g>
          <g>
            <g>
              <path
                d="M256,128.877c-11.046,0-20,8.954-20,20V277.67c0,11.046,8.954,20,20,20s20-8.954,20-20V148.877
			C276,137.831,267.046,128.877,256,128.877z"
              />
            </g>
          </g>
          <g>
            <g>
              <circle cx="256" cy="349.16" r="27" />
            </g>
          </g>
        </svg>
      );
    case "unapproved":
      return (
        <svg
          className='absolute top-11 left-11'
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          width="200px"
          height="200px"
          fill="White"
        >
          <g>
            <g>
              <path
                d="M256,0C114.508,0,0,114.497,0,256c0,141.493,114.497,256,256,256c141.492,0,256-114.497,256-256
			C512,114.507,397.503,0,256,0z M256,472c-119.384,0-216-96.607-216-216c0-119.385,96.607-216,216-216
			c119.384,0,216,96.607,216,216C472,375.385,375.393,472,256,472z"
              />
            </g>
          </g>
          <g>
            <g>
              <path
                d="M343.586,315.302L284.284,256l59.302-59.302c7.81-7.81,7.811-20.473,0.001-28.284c-7.812-7.811-20.475-7.81-28.284,0
			L256,227.716l-59.303-59.302c-7.809-7.811-20.474-7.811-28.284,0c-7.81,7.811-7.81,20.474,0.001,28.284L227.716,256
			l-59.302,59.302c-7.811,7.811-7.812,20.474-0.001,28.284c7.813,7.812,20.476,7.809,28.284,0L256,284.284l59.303,59.302
			c7.808,7.81,20.473,7.811,28.284,0C351.398,335.775,351.397,323.112,343.586,315.302z"
              />
            </g>
          </g>
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

const Modal = ({ modalState , onOptionSelect}) => {  
  const modal = ModalProps()
  return (
		// <AnimatePresence>
		// 	{modalState.showModal && (
		// 		<motion.div
		// 			className="fixed top-0 left-0 w-full h-full bg-red-900 bg-opacity-50 z-10 "
		// 			variants={backdrop}
		// 			initial="hidden"
		// 			animate="visible"
		// 			exit="hidden"
		// 		>
		// 			<motion.div
		// 				className="max-w-[400px] max-h-[400px] h-[290px] mx-auto p-10 border-b-4 border-l-2 border-r-2 border-t-2  bg-white rounded-lg text-center border-red-900 bg-gradient-to-t from-red-900 from-2% via-gray-50 via-5% to-gray-50 to-25%"
		// 				variants={modal}
		// 			>
		// 				<div
		// 					className="absolute scale-50 top-5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-red-900 "
		// 					// style={{
		// 					// 	background:
		// 					// 		"linear-gradient(0deg, rgba(0, 122, 92, 1) -90%, rgba(0, 0, 0, 1))",
		// 					// }}
		// 				>
		// 					<Icons icon={modalState.icon} />
		// 				</div>
		// 				<p className={`absolute bottom-16 left-1 right-1 text-lg text-black ${modalState.options ? 'mb-6' : ""}`}>
		// 					{modalState.text}
		// 				</p>
		// 				<p className="absolute bottom-28 left-1 right-1 text-2xl text-black mb-6">
		// 					{modalState.title}
		// 				</p>
		// 				{modalState.options ? (
		// 					<div className="absolute bottom-6 left-1 right-1">
		// 						<div className="flex flex-nowrap w-full justify-evenly">
		// 							<button
		// 								className="bg-gradient-to-br relative transition ease-in-out delay-0 hover:-translate-y-1 group/btn from-red-900 dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-[35%] text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
		// 								style={{
		// 									background:
		// 										"linear-gradient(0deg, rgba(0, 122, 92, 1) -90%, rgba(0, 0, 0, 1))",
		// 								}}
		// 								onClick={() => {
		// 									onOptionSelect(true);
		// 								}}
		// 							>
		// 								Confirm
		// 							</button>
		// 							<button
		// 								className="bg-gradient-to-br border-2 transition ease-in-out delay-0 hover:-translate-y-1 border-red-900 relative group/btn block dark:bg-zinc-800 w-[35%] text-red-900 rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"

		// 								onClick={() => {
		// 									onOptionSelect(false);
		// 								}}
		// 							>
		// 								Cancel
		// 							</button>
		// 						</div>
		// 					</div>
		// 				) : (
		// 					<></>
		// 				)}
		// 			</motion.div>
		// 		</motion.div>
		// 	)}
		// </AnimatePresence>
    <AnimatePresence>
    {toastState.show && (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        variants={toastVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="relative flex items-center max-w-sm px-6 py-4 bg-white border-l-4 rounded shadow-lg border-red-900">
          <div className="absolute top-[-15px] right-[-15px] w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
            {/* Icon or placeholder */}
            <Icons icon={toastState.icon || 'bell'} />
          </div>
          <div className="ml-4">
            <p className="text-lg font-semibold text-red-900">{toastState.title}</p>
            <p className="text-sm text-gray-800">{toastState.message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-sm text-red-800 hover:underline"
          >
            X
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
	);
}

export default Modal;