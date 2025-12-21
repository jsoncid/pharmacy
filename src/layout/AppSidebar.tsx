import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { FiShoppingCart } from "react-icons/fi";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  HorizontaLDots,
  PlugInIcon,
  UserCircleIcon,
  BoxIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { usePermissions } from "../hooks/usePermissions";

type SubItem = {
  name: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: SubItem[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasTeamId } = usePermissions();

  const navItems: NavItem[] = [
    // {
    //   icon: <GridIcon />,
    //   name: "Dashboard",
    //   subItems: [{ name: "Ecommerce", path: "/", pro: false }],
    // },


    ...(hasTeamId('users') ? [{
      icon: <UserCircleIcon />,
      name: "User Profile",
      path: "/profile",
    }] : []),
    {
      icon: <FiShoppingCart />,
      name: "Point of Sale",
      path: "/profile",
    },

     {
      icon: <BoxIcon />,
      name: "Inventories",
      subItems: [
        { name: "Inbound Stocks", path: "/inventories/inbound-stocks" },
        { name: "Location Management", path: "/inventories/location-aisles" },
      ],
    },

    {
      icon: <BoxIcon />,
      name: "Deliveries",
      subItems: [
        { name: "Units", path: "/deliveries/units" },
        { name: "Brands", path: "/deliveries/brands" },
      ],
    },

    {
      icon: <BoxIcon />,
      name: "Products",
      subItems: [
        { name: "Categories", path: "/products/categories" },
        {
          name: "Medical Supply Specifications",
          subItems: [
            {
              name: "Materials", path: "/products/medical_supplies_technical_descriptions/materials",
            },
            {
              name: "Sizes",
              path: "/products/medical_supplies_technical_descriptions/sizes",
            },
            {
              name: "Capacity & Volumes",
              path: "/products/medical_supplies_technical_descriptions/capacity_volumes",
            },
            {
              name: "Sterilities",
              path: "/products/medical_supplies_technical_descriptions/sterilities",
            },
            {
              name: "Usabilities",
              path: "/products/medical_supplies_technical_descriptions/usabilities",
            },
            {
              name: "Contents",
              path: "/products/medical_supplies_technical_descriptions/contents",
            },
            {
              name: "Straps",
              path: "/products/medical_supplies_technical_descriptions/straps",
            },
          ],
        },
        {
          name: "Drugs & Medicine Specifications",
          subItems: [
            { name: "Dossage & Forms", path: "/products/drug_technical_descriptions/dossage_forms" },
            { name: "Unit Doses", path: "/products/drug_technical_descriptions/unit_doses" },
            { name: "Containers", path: "/products/drug_technical_descriptions/containers" },
            { name: "ATC Codes", path: "/products/drug_technical_descriptions/atc_codes" },
            { name: "Anatomicals", path: "/products/drug_technical_descriptions/anatomicals" },
            { name: "Therapeutics", path: "/products/drug_technical_descriptions/therapeutics" },
            { name: "Pharmacologicals", path: "/products/drug_technical_descriptions/pharmacologicals" },
          ],
        },
      ],
    },
   
    
    //   icon: <PageIcon />,
    //   name: "My books",
    //   path: "/my-books",
    // },
    // {
    //   name: "Forms",
    //   icon: <ListIcon />,
    //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
    // },
    // {
    //   name: "Tables",
    //   icon: <TableIcon />,
    //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
    // },
    // {
    //   name: "Pages",
    //   icon: <PageIcon />,
    //   subItems: [
    //     { name: "Blank Page", path: "/blank", pro: false },
    //     { name: "404 Error", path: "/error-404", pro: false },
    //   ],
    // },
  ];

  // Define othersItems conditionally based on team membership
  const othersItems: NavItem[] = [
    // {
    //   icon: <PieChartIcon />,
    //   name: "Charts",
    //   subItems: [
    //     { name: "Line Chart", path: "/line-chart", pro: false },
    //     { name: "Bar Chart", path: "/bar-chart", pro: false },
    //   ],
    // },
    // {
    //   icon: <BoxCubeIcon />,
    //   name: "UI Elements",
    //   subItems: [
    //     { name: "Alerts", path: "/alerts", pro: false },
    //     { name: "Avatar", path: "/avatars", pro: false },
    //     { name: "Badge", path: "/badge", pro: false },
    //     { name: "Buttons", path: "/buttons", pro: false },
    //     { name: "Images", path: "/images", pro: false },
    //     { name: "Videos", path: "/videos", pro: false },
    //   ],
    // },
    ...(hasTeamId('system-administrators') ? [{
      icon: <PlugInIcon />,
      name: "Authentication",
      subItems: [
        // { name: "Sign In", path: "/signin", pro: false },
        // { name: "Sign Up", path: "/signup", pro: false },
        { name: "User/s", path: "/users", pro: false },
        { name: "User Assignment/s", path: "/user-level-assignment", pro: false },
        { name: "Team/s", path: "/teams", pro: false },
        { name: "User Level/s", path: "/user-level", pro: false },
        
      ],
    }] : [])
  ];

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [openNestedGroup, setOpenNestedGroup] = useState<string | null>(null);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const hasActiveSubItem = (subItems: SubItem[]): boolean => {
    return subItems.some((subItem) => {
      if (subItem.path && isActive(subItem.path)) {
        return true;
      }
      if (subItem.subItems) {
        return hasActiveSubItem(subItem.subItems);
      }
      return false;
    });
  };

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems && hasActiveSubItem(nav.subItems)) {
          setOpenSubmenu({
            type: menuType as "main" | "others",
            index,
          });
          submenuMatched = true;
        }
      });
    });

    if (!submenuMatched) {
      const isOnLandingWithOpenMenu =
        openSubmenu &&
        openSubmenu.type === "main" &&
        ((location.pathname === "/products" &&
          navItems[openSubmenu.index]?.name === "Products") ||
          (location.pathname === "/inventories" &&
            navItems[openSubmenu.index]?.name === "Inventories") ||
          (location.pathname === "/deliveries" &&
            navItems[openSubmenu.index]?.name === "Deliveries"));

      if (!isOnLandingWithOpenMenu) {
        setOpenSubmenu(null);
      }
    }
  }, [location, isActive]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const toggleNestedGroup = (name: string) => {
    setOpenNestedGroup((prev) => (prev === name ? null : name));
  };

  const renderSubItems = (subItems: SubItem[], depth: number = 0): React.ReactElement => (
    <ul className={`mt-2 space-y-1 ${depth === 0 ? 'ml-9' : 'ml-4'}`}>
      {subItems.map((subItem) => (
        <li key={subItem.name}>
          {subItem.subItems ? (
            <button
              onClick={() => toggleNestedGroup(subItem.name)}
              className="menu-dropdown-item menu-dropdown-item-inactive cursor-pointer w-full text-left"
            >
              {subItem.name}
              <ChevronDownIcon
                className={`ml-auto w-4 h-4 transition-transform ${
                  openNestedGroup === subItem.name
                    ? "rotate-180 text-brand-500"
                    : ""
                }`}
              />
            </button>
          ) : subItem.path ? (
            <Link
              to={subItem.path}
              className={`menu-dropdown-item ${
                isActive(subItem.path)
                  ? "menu-dropdown-item-active"
                  : "menu-dropdown-item-inactive"
              }`}
            >
              {subItem.name}
              <span className="flex items-center gap-1 ml-auto">
                {subItem.new && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-inactive">
                    new
                  </span>
                )}
                {subItem.pro && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-inactive">
                    pro
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <div className="menu-dropdown-item menu-dropdown-item-inactive">
              {subItem.name}
              <span className="flex items-center gap-1 ml-auto">
                {subItem.new && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-inactive">
                    new
                  </span>
                )}
                {subItem.pro && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-inactive">
                    pro
                  </span>
                )}
              </span>
            </div>
          )}
          {subItem.subItems && openNestedGroup === subItem.name && (
            <div className="mt-1">
              {renderSubItems(subItem.subItems, depth + 1)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => {
                if (
                  nav.name === "Products" ||
                  nav.name === "Inventories" ||
                  nav.name === "Deliveries"
                ) {
                  const landingPath =
                    nav.name === "Products"
                      ? "/products"
                      : nav.name === "Inventories"
                      ? "/inventories"
                      : "/deliveries";
                  const isCurrentlyOpen =
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index;

                  if (isCurrentlyOpen) {
                    handleSubmenuToggle(index, menuType);
                  } else {
                    navigate(landingPath);
                    handleSubmenuToggle(index, menuType);
                  }
                } else {
                  handleSubmenuToggle(index, menuType);
                }
              }}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems &&
            (isExpanded || isHovered || isMobileOpen) &&
            openSubmenu?.type === menuType &&
            openSubmenu?.index === index && (
              <div className="mt-2">
                {renderSubItems(nav.subItems, 0)}
              </div>
            )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
