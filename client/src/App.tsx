import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import RoleSelection from "@/pages/RoleSelection";
import FarmerOptions from "@/pages/farmer/Options";
import FarmerBuy from "@/pages/farmer/Buy";
import FarmerSell from "@/pages/farmer/Sell";
import CompanyOptions from "@/pages/company/Options";
import CompanyBuy from "@/pages/company/Buy";
import CompanySell from "@/pages/company/Sell";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/role-selection" component={RoleSelection} />
          <Route path="/farmer/options" component={FarmerOptions} />
          <Route path="/farmer/buy" component={FarmerBuy} />
          <Route path="/farmer/sell" component={FarmerSell} />
          <Route path="/company/options" component={CompanyOptions} />
          <Route path="/company/buy" component={CompanyBuy} />
          <Route path="/company/sell" component={CompanySell} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
