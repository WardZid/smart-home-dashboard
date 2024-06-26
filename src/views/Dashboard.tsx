import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDarkMode } from '../contexts/DarkModeContext';

import * as user from '../models/User';
import * as room from '../models/Room';

import RoomDashboard from '../components/room/RoomDashboard';
import RoomItem from '../components/room/RoomItem';
import WatchingCircle from '../components/WatchingCircle';
import SettingsDialog from '../components/settings/SettingsDialog';
import AddWidgetDialog from '../components/add_widget/AddWidgetDialog';
import WidgetDetailsDialog from '../components/room/WidgetDetailsDialog';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  //for display
  const [fullName, setFullName] = useState<string>("");

  //sidebar rooms
  const [rooms, setRooms] = useState<room.Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<room.Room | null>(null);

  //new room
  const [newRoomName, setNewRoomName] = useState<string>('');


  //widgets
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);
  const [isWidgetDetailsDialogOpen, setIsWidgetDetailsDialogOpen] = useState(false);
  const [widgetDetailsId, setWidgetDetailsId] = useState<string>('');


  //refresh Flag for when widgets are altered
  const [widgetRefreshFlag, setWidgetRefreshFlag] = useState<boolean>(false);
  const toggleWidgetRefreshFlag = () => {
    setWidgetRefreshFlag(!widgetRefreshFlag);
  };

  //sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarVisibleUserPreference, setsidebarVisibleUserPreference] = useState(true);

  const [isSidebarToggleHovered, setIsSidebarToggleHovered] = useState(false);
  const [isScreenSmall, setIsScreenSmall] = useState(false);

  const updateSidebarVisibility = () => {
    setIsScreenSmall(window.innerWidth < 768); //768 is a very logical num
  };

  useEffect(() => {
    // console.log("sidebarVisibleUserPreference");

    setSidebarVisible(sidebarVisibleUserPreference);
  }, [sidebarVisibleUserPreference]);

  useEffect(() => {
    // console.log("isScreenSmall");
    if (isScreenSmall) {
      if (sidebarVisible) {
        setSidebarVisible(false);
      }
    } else {
      // console.log("preference");
      // console.log(sidebarVisibleUserPreference);
      setSidebarVisible(sidebarVisibleUserPreference);
    }
  }, [isScreenSmall]);

  const toggleSidebarUserPref = () => {
    setsidebarVisibleUserPreference(!sidebarVisibleUserPreference);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  useEffect(() => {
    const checkLoggedIn = async () => {
      const loggedIn = await user.isLoggedIn();
      if (!loggedIn) {
        // If not logged in, sign out and redirect to login
        user.logOut();
        navigate('/login');
      }
    };

    user.getUserInfo()
      .then((userInfo) => {
        if (userInfo !== null) {
          setFullName(userInfo.first_name + " " + userInfo.last_name);
        } else {
          console.error("User info is null");
        }
      })
      .catch((error) => {
        if (error instanceof user.AuthenticationError) {
          user.logOut();
          navigate("/login");
          console.log("Credentials Expired");
        } else {
          console.error('Error:', error);
        }
      });


    const fetchRooms = async () => {
      try {
        const roomsData = await room.getRooms();
        setRooms(roomsData);
        if (roomsData.length > 0) {
          setSelectedRoom(roomsData[0]);
        }

      } catch (error) {
        if (error instanceof user.AuthenticationError) {
          user.logOut();
          navigate("/login");
          console.log("Credentials Expired");
        } else {
          console.error('Error fetching rooms:', error);
        }
      }
    };

    checkLoggedIn();
    fetchRooms();

    //listener to close the side menu if the screen is too thin
    updateSidebarVisibility();
    window.addEventListener('resize', updateSidebarVisibility);
    return () => window.removeEventListener('resize', updateSidebarVisibility);

  }, []);

  useEffect(() => {
    //if the room deleted was the one selected, make sure to select another
    const selectedRoomIndex = rooms.findIndex(room => room._id === selectedRoom?._id);
    if (selectedRoomIndex === -1) {
      // If selected room does not exist, switch to the first room in the array or null if array is empty
      setSelectedRoom(rooms.length > 0 ? rooms[0] : null);
    }
  }, [rooms]);

  const handleCreateRoom = async () => {
    try {
      if (newRoomName) {
        // console.log(newRoomName);
        await room.addRoom(newRoomName);
        // After successfully adding the room, fetch the updated list of rooms
        const updatedRooms = await room.getRooms();
        setRooms(updatedRooms);
      }
      setNewRoomName(''); // Clear the input field
    } catch (error) {
      if (error instanceof user.AuthenticationError) {
        user.logOut();
        navigate("/login");
        console.log("Credentials Expired");
      } else {
        console.error('Error Creating Room:', error);
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await room.deleteRoom(roomId);
      // After successfully deleting the room, fetch the updated list of rooms
      const updatedRooms = await room.getRooms();
      setRooms(updatedRooms);

      // console.log(rooms);


    } catch (error) {
      if (error instanceof user.AuthenticationError) {
        user.logOut();
        navigate("/login");
        console.log("Credentials Expired");
      } else {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleRoomSelect = (room: room.Room) => {
    setSelectedRoom(room);
  };

  const handleChangeNewRoomName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewRoomName(event.target.value);
  };
  const handleEyeClick = () => {
    navigate("/");
  };
  const handleLogout = () => {
    user.logOut();
    navigate("/login");
    console.log("Logged out successfully");
  };
  const toggleSettingsDialog = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleWidgetDetailsOpen = (widgetId: string) => {
    setWidgetDetailsId(widgetId);
    toggleWidgetDialogDetails();
  };

  const toggleWidgetDialogDetails = () => {
    if (widgetDetailsId) {
      setIsWidgetDetailsDialogOpen(!isWidgetDetailsDialogOpen);
    }
  };

  const toggleAddWidgetDialog = () => {
    //if no room is selected (shouldnt happen), the dialog wont open
    if (selectedRoom) {
      setIsAddWidgetDialogOpen(!isAddWidgetDialogOpen);
    }
  };

  const renderSidebarCtrl = () => {
    {/* svgs for closing and opening sidebar */ }
    return (
      <div className={`h-full px-1 flex flex-col justify-center `}>
        <div className="cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-500"

          onMouseEnter={() => setIsSidebarToggleHovered(true)}
          onMouseLeave={() => setIsSidebarToggleHovered(false)}
        >
          {isSidebarToggleHovered ? (
            (
              sidebarVisible ?
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 28"
                  width="16"
                  height="28"
                  onClick={toggleSidebarUserPref}
                >
                  <path
                    d="M8 4A1 1 0 0 1 8.64 4.23A1 1 0 0 1 8.77 5.64L4.29 11L8.61 16.37A1 1 0 0 1 8.46 17.78A1 1 0 0 1 7 17.63L2.17 11.63A1 1 0 0 1 2.17 10.36L7.17 4.36A1 1 0 0 1 8 4Z"
                    fill="currentColor"
                    transform="translate(2,3) "
                  />
                </svg>

                :

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 28"
                  width="16"
                  height="28"
                  onClick={toggleSidebarUserPref}
                >
                  <path
                    d="M10 19a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41L13.71 12 9.39 6.63a1 1 0 0 1 .15-1.41 1 1 0 0 1 1.46.15l4.83 6a1 1 0 0 1 0 1.27l-5 6A1 1 0 0 1 10 19z"
                    fill="currentColor"
                    transform="translate(-4,2)"
                  />
                </svg>
            )
          )
            :
            (

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 28"
                width="16"
                height="28"
              >
                <line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            )
          }
        </div>
      </div>

    );
  }
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className="
          h-screen flex flex-col 
        bg-slate-50 dark:bg-slate-700
        text-dark-blue dark:text-off-white "
      >
        <div className="flex h-full flex-row overflow-hidden">

          {/*sidebar*/}
          <div className={`overflow-hidden ${isScreenSmall && sidebarVisible ? 'fixed h-full z-10 w-60 flex flex-row' : ''} ${sidebarVisible ? 'w-52' : 'w-0'} transition-all duration-500 ease-in-out`}>

            <div className={`h-full flex flex-col px-2 pt-4 min-w-52 bg-off-white dark:bg-dark-blue `}>

              <div className="flex justify-center items-center pb-4">
                <div onClick={handleEyeClick}>
                  <WatchingCircle outerCircleColor={darkMode ? "#EEEEEE" : "#042A35"} innerCircleColor={darkMode ? "#042A35" : "#EEEEEE"} />
                </div>
                <h1 className="px-2">Hello, {fullName}!</h1>
              </div>

              <div className="py-1 px-1 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer rounded-lg flex flex-col">
                <input
                  type="text"
                  className="text-lg px-2 bg-transparent border-none focus:outline-none"
                  placeholder="Enter room name"
                  value={newRoomName}
                  onChange={handleChangeNewRoomName}
                />

                <button
                  className="text-lg font-bold px-2 border-2 border-transparent hover:border-slate-400 dark:hover:border-slate-600
                cursor-pointer rounded-lg"
                  onClick={handleCreateRoom}
                >
                  Create
                </button>
              </div>
              <h6 className="mt-6 px-2 text-base opacity-70">Rooms</h6>

              <div className="flex-grow flex flex-col">

                {/* if no rooms, show helpful msg */}
                {rooms.length === 0 &&

                  <div className="text-center mt-5 opacity-90">Create a room to start!</div>
                }

                {rooms.map(room => (
                  <RoomItem
                    key={room._id}
                    room={room}
                    onSelect={handleRoomSelect}
                    onDelete={handleDeleteRoom}
                    isSelected={selectedRoom !== null && selectedRoom._id === room._id}
                  />
                ))}

              </div>

              <div className="flex justify-center items-center py-2">
                <button className="flex-grow mx-1 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                  onClick={toggleSettingsDialog}>
                  Settings
                </button>
                <button className="flex-grow mx-1 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700"
                  onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
            {isScreenSmall && sidebarVisible &&
              <div className="relative h-full  top-0 ">

                {renderSidebarCtrl()}
              </div>}
          </div>

          {renderSidebarCtrl()}


          {/*main area of dashboard*/}
          <div className="flex-grow overflow-y-hidden flex flex-col">
            <div
              className="
            flex flex-row
            px-4 py-2">
              <div className="flex-grow flex flex-row text-2xl font-bold">
                <div className="dark:text-off-white text-dark-blue">{isScreenSmall ? "S." : "Smart "}</div>
                <div className="dark:text-off-white text-orange">{isScreenSmall ? "H." : "Home "}</div>
                <div className="dark:text-off-white text-dark-blue">{isScreenSmall ? "A." : "Automation "}</div>
                <div className="dark:text-off-white text-orange">{isScreenSmall ? "D." : "Dashboard "}</div>
              </div>

              <button
                className={`
                  text-dark-blue dark:text-orange
                    font-bold 
                    rounded-lg py-1 px-2
                    ${selectedRoom ? "" : 'opacity-20'}`}
                onClick={toggleAddWidgetDialog}>
                Add Widget
              </button>
            </div>

            <div
              className="overflow-y-scroll flex-grow "
            >

              {/* Render RoomDashboard component if a room is selected */}
              {selectedRoom ?

                <RoomDashboard roomId={selectedRoom._id} onDetailsOpen={handleWidgetDetailsOpen} refreshFlag={widgetRefreshFlag} />
                :
                <div className="flex-grow flex flex-col justify-center h-full w-full text-2xl font-bold ">
                  <div className="w-full text-center opacity-70 dark:text-off-white text-dark-blue">Take Control of Your Home!</div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>
      <SettingsDialog isOpen={isSettingsOpen} onClose={toggleSettingsDialog} />
      <AddWidgetDialog roomId={selectedRoom ? selectedRoom._id : ''} onAddWidget={toggleWidgetRefreshFlag} isOpen={isAddWidgetDialogOpen} onClose={toggleAddWidgetDialog} />
      <WidgetDetailsDialog widgetId={widgetDetailsId} onDeleteWidget={toggleWidgetRefreshFlag} isOpen={isWidgetDetailsDialogOpen} onClose={toggleWidgetDialogDetails} />

    </div>

  );
};

export default Dashboard;
