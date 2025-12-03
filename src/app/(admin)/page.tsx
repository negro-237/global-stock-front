"use client";

import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { useDashboard } from "../../../hooks/useDashboard";

export default function Dashboard() {

  const { products, orders, sales, months, lastOrders } = useDashboard();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics products={products} orders={orders} />

        <MonthlySalesChart months={months} sales={sales} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        {/* <MonthlyTarget /> */}
        <RecentOrders orders={lastOrders} />
      </div>

     {/*  <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div> */}

     {/*  <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div> */}
    </div>
  );
}
