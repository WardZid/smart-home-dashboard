import React, { useState } from 'react';
import * as user from "../../models/User";
import * as widget from '../../models/Widget'
import * as deviceModel from '../../models/Device'
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useNavigate } from 'react-router-dom';

interface WidgetItemProps {
    widget: widget.Widget
}

const WidgetItem: React.FC<WidgetItemProps> = ({ widget }) => {
    const navigate = useNavigate();
    const [deviceState, setDeviceState] = useState(widget.device.measurement.state);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

    const handleDeviceStateChange = async (newValue: string) => {
        setDeviceState(newValue);
        try {
            await deviceModel.updateDeviceState(widget.device._id, newValue);
            const updatedDevice = await deviceModel.getDevice(widget.device._id);
            widget.device = updatedDevice;
        } catch (error) {
            if (error instanceof user.AuthenticationError) {
                user.logOut();
                navigate("/login");
                console.log("Credentials Expired");
            } else {
                console.error('Error updating device state:', error);
            }
        }
    };

    const renderValueControl = () => {
        switch (widget.device.measurement.type) {
            case "bool":
                return (
                    <div>
                        <button
                            className={`rounded w-full p-1 text-off-white 
                            ${deviceState === '0' ? 'bg-rose-800' : 'bg-lime-800'}`
                            }
                            onClick={() => handleDeviceStateChange(deviceState === '0' ? '1' : '0')}
                        >
                            {deviceState === '0' ? 'OFF' : 'ON'}
                        </button>
                    </div>
                );
            case "int":
                return (
                    <div className="flex flex-col items-center">
                        <h6>{deviceState}</h6>
                        <input
                            className="w-full "
                            type="range"
                            min={widget.device.measurement.min}
                            max={widget.device.measurement.max}
                            value={deviceState}
                            onChange={(event) => setDeviceState(event.target.value)} //changes loacl value
                            onMouseUp={() => handleDeviceStateChange(deviceState)} //changes db value on release
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className={`
                rounded 
                bg-off-white dark:bg-slate-800  
                text-dark-blue dark:text-off-white
                w-full h-full
                flex flex-col
                overflow-hidden
                shadow-lg
                border-dark-blue`}
            style={{
                userSelect: 'none'
            }}
        >
            <div className="h-4 bg-light-blue
             react-grid-drag-handle cursor-grab active:cursor-grabbing">
                {/*Top bar for moving*/}
            </div>
            <div className=" p-2 flex flex-col justify-between overflow-hidden flex-grow">

                <div className="flex flex-row">
                    <h1 className="text-xl font-semibold flex-grow">{widget.title}</h1>
                    <div>
                        <div
                            className="relative rounded-sm text-xl hover:dark:bg-slate-500"
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}>
                            <svg fill="currentColor" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"><path d="M3,4V20a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V4a1,1,0,0,0-1-1H4A1,1,0,0,0,3,4ZM5,5H19V19H10V15a1,1,0,0,0-1-1H5Zm6.293,7.707a1,1,0,0,1,0-1.414L14.086,8.5H13a1,1,0,0,1,0-2h3.5a1.01,1.01,0,0,1,.382.077A1,1,0,0,1,17.5,7.5V11a1,1,0,0,1-2,0V9.914l-2.793,2.793A1,1,0,0,1,11.293,12.707Z"></path></g></svg>

                        </div>

                        {isMoreMenuOpen &&
                            <div className="absolute right-0 p-1 rounded-lg text-lg
                                bg-off-white dark:bg-slate-700 shadow-md">
                                <div className="block px-3 rounded hover:dark:bg-slate-600">More</div>
                                <div className="block px-3 rounded hover:dark:bg-slate-600 text-red-500">Delete</div>
                            </div>
                        }
                    </div>

                </div>

                {renderValueControl()}
            </div>
            {/* {isMoreMenuOpen &&
                <button
                    className="fixed inset-0 h-full w-full bg-red-500"
                    onClick={() => setIsMoreMenuOpen(false)}></button>
            } */}
        </div>

    );
};

export default WidgetItem;  