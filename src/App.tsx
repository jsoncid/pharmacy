import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/OtherPage/UserProfiles";
import Teams from "./pages/OtherPage/Teams";
import Users from "./pages/OtherPage/Users";
import UserLevel from "./pages/OtherPage/UserLevel";
import UserLevelAssignment from "./pages/OtherPage/UserLevelAssignment";
// import MyBooks from "./pages/MyBooks";
// import Videos from "./pages/UiElements/Videos";
// import Images from "./pages/UiElements/Images";
// import Alerts from "./pages/UiElements/Alerts";
// import Badges from "./pages/UiElements/Badges";
// import Avatars from "./pages/UiElements/Avatars";
// import Buttons from "./pages/UiElements/Buttons";
// import LineChart from "./pages/Charts/LineChart";
// import BarChart from "./pages/Charts/BarChart";
// import Calendar from "./pages/Calendar";
// import BasicTables from "./pages/Tables/BasicTables";
// import FormElements from "./pages/Forms/FormElements";
// import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import Products from "./pages/Products/Products";
import AtcCodes from "./pages/Products/DrugTechnicalDescriptions/AtcCodes";
import Anatomicals from "./pages/Products/DrugTechnicalDescriptions/Anatomicals";
import Therapeutics from "./pages/Products/DrugTechnicalDescriptions/Therapeutics";
import Pharmacologicals from "./pages/Products/DrugTechnicalDescriptions/Pharmacologicals";
import Categories from "./pages/Products/Categories";
import DosageForms from "./pages/Products/DrugTechnicalDescriptions/DosageForms";
import Containers from "./pages/Products/DrugTechnicalDescriptions/Containers";
import Materials from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Materials";
import Sizes from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Sizes";
import CapacityVolumes from "./pages/Products/MedicalSuppliesTechnicalDescriptions/CapacityVolumes";
import Sterilities from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Sterilities";
import Usabilities from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Usabilities";
import Contents from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Contents";
import Straps from "./pages/Products/MedicalSuppliesTechnicalDescriptions/Straps";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { Databases, Query, Functions } from "appwrite";
import client from "./lib/appwrite";

const databases = new Databases(client);
const functionsAPI = new Functions(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_USER_ASSIGNMENT; // User Level Assignments collection
const FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_TEAM_MEMBERSHIP; // appwrite-function-team-membership

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      verifyUserAssignmentAndCreateMembership();
    }
  }, [user]);

  const verifyUserAssignmentAndCreateMembership = async () => {
    if (!user) return;

    // console.log('User email:', user.email);

    try {
      // Query for user assignments
      const assignments = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('user_id', user.$id)]
      );

      if (assignments.documents.length > 0) {
        // console.log('User has assignments:', assignments.documents);
        
        // Get all teams_and_roles for user's assignments
        const allTeamsAndRoles = [];
        
        for (const assignment of assignments.documents) {
          const userLevelToTeamsId = assignment.userLevelToTeams;
          
          // Skip if userLevelToTeamsId is empty or undefined
          if (!userLevelToTeamsId) {
            console.warn('Skipping assignment with empty userLevelToTeams field:', assignment.$id);
            continue;
          }
          
          const teamsAndRoles = await databases.listDocuments(
            DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_USER_LEVEL_TO_TEAMS,
            [Query.equal('$id', userLevelToTeamsId)]
          );
          
          if (teamsAndRoles.documents.length > 0) {
            const teamsAndRolesData = teamsAndRoles.documents[0].teams_and_roles;
            allTeamsAndRoles.push({
              assignmentId: assignment.$id,
              teamsAndRoles: teamsAndRolesData
            });
          }
        }
        
        // console.log('All teams and roles for user assignments:', allTeamsAndRoles);

        // Collect all unique team IDs
        const allTeamIds = [...new Set(
          allTeamsAndRoles.flatMap(item => 
            item.teamsAndRoles.map((str: string) => str.split(':')[0])
          )
        )];

        // Parse teams and roles and create memberships
        for (const item of allTeamsAndRoles) {
          const teamsAndRolesArray = Array.isArray(item.teamsAndRoles) ? item.teamsAndRoles : [item.teamsAndRoles];
          
          for (const teamsAndRolesStr of teamsAndRolesArray) {
            const [teamId, rolesStr] = teamsAndRolesStr.split(':');
            const roles = rolesStr ? rolesStr.split(',') : [];
            
            // console.log(`Creating membership for team ${teamId} with roles:`, roles);
            
            // Call the function to create membership
            await functionsAPI.createExecution(
              FUNCTION_ID,
              JSON.stringify({
                teamId: teamId,
                email: user.email,
                userId: user.$id,
                phone: undefined,
                url: undefined,
                roles: roles,
                allTeams: allTeamIds
              }),
              false // async
            );
          }
        }
      }
    } catch (error) {
      console.error('Error verifying assignment or creating membership:', error);
    }
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/categories" element={<Categories />} />
          <Route
            path="/products/medical_supplies_technical_descriptions/materials"
            element={<Materials />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/sizes"
            element={<Sizes />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/capacity_volumes"
            element={<CapacityVolumes />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/sterilities"
            element={<Sterilities />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/usabilities"
            element={<Usabilities />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/contents"
            element={<Contents />}
          />
          <Route
            path="/products/medical_supplies_technical_descriptions/straps"
            element={<Straps />}
          />
          <Route path="/products/drug_technical_descriptions/atc_codes" element={<AtcCodes />} />
          <Route path="/products/drug_technical_descriptions/anatomicals" element={<Anatomicals />} />
          <Route path="/products/drug_technical_descriptions/therapeutics" element={<Therapeutics />} />
          <Route path="/products/drug_technical_descriptions/pharmacologicals" element={<Pharmacologicals />} />
          <Route path="/products/drug_technical_descriptions/dossage_forms" element={<DosageForms />} />
          <Route path="/products/drug_technical_descriptions/containers" element={<Containers />} />

          {/* Others Page */}
          <Route path="/profile" element={<ProtectedRoute requiredTeamId="users"><UserProfiles /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute requiredTeamId="system-administrators"><Teams /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredTeamId="system-administrators"><Users /></ProtectedRoute>} />
          <Route path="/user-level" element={<ProtectedRoute requiredTeamId="system-administrators"><UserLevel /></ProtectedRoute>} />
          <Route path="/user-level-assignment" element={<ProtectedRoute requiredTeamId="system-administrators"><UserLevelAssignment /></ProtectedRoute>} />
          {/* <Route path="/calendar" element={<Calendar />} />
          <Route path="/my-books" element={<MyBooks />} />
          <Route path="/blank" element={<Blank />} /> */}

          {/* Forms */}
          {/* <Route path="/form-elements" element={<FormElements />} /> */}

          {/* Tables */}
          {/* <Route path="/basic-tables" element={<BasicTables />} /> */}

          {/* Ui Elements */}
          {/* <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} /> */}

          {/* Charts */}
          {/* <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} /> */}
        </Route>

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
