#!/usr/bin/env python3
"""
KidBook Creator - P&L Forecasting Excel Generator
Generates a comprehensive 12-month P&L forecast with conversion funnel analysis
"""

import csv
from datetime import datetime

def generate_csv_files():
    """Generate CSV files that can be imported into Excel"""
    
    # ============================================
    # TAB 1: ASSUMPTIONS
    # ============================================
    assumptions_data = [
        ["KIDBOOK CREATOR - P&L FORECASTING MODEL", "", "", ""],
        ["Version 2.0", "", "", ""],
        ["Last Updated", datetime.now().strftime("%Y-%m-%d"), "", ""],
        ["", "", "", ""],
        ["FIXED MONTHLY COSTS", "", "", ""],
        ["Supabase Pro", "$25.00", "", ""],
        ["Netlify", "$9.00", "", ""],
        ["Buffer for Additional Services", "$100.00", "", ""],
        ["TOTAL FIXED MONTHLY", "$134.00", "", ""],
        ["", "", "", ""],
        ["ONE-TIME SETUP COSTS", "", "", ""],
        ["Gemini API Credits", "$150.00", "", ""],
        ["Domain Registration", "$100.00", "", ""],
        ["Example Books Creation", "$75.00", "", "Average of $50-100"],
        ["Friends & Family Testing", "$350.00", "", ""],
        ["TOTAL SETUP COSTS", "$675.00", "", ""],
        ["", "", "", ""],
        ["PRICING", "", "", ""],
        ["Digital Book (PDF)", "$15.00", "", ""],
        ["Printed Hardcover Book", "$45.00", "", ""],
        ["", "", "", ""],
        ["CONVERSION FUNNEL", "", "", ""],
        ["Preview Conversion to Digital", "2.0%", "", "Editable"],
        ["Preview Conversion to Printed", "2.0%", "", "Editable"],
        ["Total Conversion Rate", "4.0%", "", "Auto-calculated"],
        ["", "", "", ""],
        ["VARIABLE COSTS - PREVIEW", "", "", ""],
        ["AI Generation (1 image + text)", "$0.09", "", ""],
        ["Storage", "$0.00", "", "Negligible"],
        ["TOTAL COST PER PREVIEW", "$0.09", "", ""],
        ["", "", "", ""],
        ["VARIABLE COSTS - DIGITAL BOOK", "", "", ""],
        ["AI Generation", "$0.50", "", ""],
        ["Storage (permanent)", "$0.02", "", "Per month"],
        ["Payment Processing (2.9% + $0.30)", "$0.74", "", "Based on $15 price"],
        ["TOTAL COST PER DIGITAL", "$1.26", "", ""],
        ["", "", "", ""],
        ["VARIABLE COSTS - PRINTED HARDCOVER", "", "", ""],
        ["AI Generation", "$0.50", "", ""],
        ["Storage (permanent)", "$0.02", "", "Per month"],
        ["Printing (Lulu - 24 pages)", "$14.50", "", "Small Square Hardcover"],
        ["Shipping (EU average)", "$12.00", "", ""],
        ["Payment Processing (2.9% + $0.30)", "$1.61", "", "Based on $45 price"],
        ["TOTAL COST PER PRINTED", "$28.63", "", ""],
        ["", "", "", ""],
        ["REFUND & QUALITY COSTS", "", "", ""],
        ["Refund Rate", "3.0%", "", "2-5% range"],
        ["Failed Print Jobs", "1.5%", "", "1-2% range"],
        ["", "", "", ""],
        ["MARKET MIX", "", "", ""],
        ["Geography", "100% EU", "", ""],
        ["Digital vs Printed Split", "25% / 75%", "", "Of conversions"],
        ["Average Page Count", "24", "", ""],
    ]
    
    with open('01_Assumptions.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(assumptions_data)
    
    # ============================================
    # TAB 2: CONVERSION FUNNEL ANALYSIS
    # ============================================
    funnel_data = [
        ["CONVERSION FUNNEL ECONOMICS", "", "", "", ""],
        ["", "", "", "", ""],
        ["Per 100 Preview Generations", "Cost", "Conversions", "Revenue", "Profit"],
        ["", "", "", "", ""],
        ["Preview Generation Cost", "$9.00", "", "", ""],
        ["(100 previews × $0.09)", "", "", "", ""],
        ["", "", "", "", ""],
        ["Digital Conversions (2%)", "", "2", "$30.00", ""],
        ["Cost per digital", "$1.26", "", "", ""],
        ["Total digital cost", "$2.52", "", "", ""],
        ["Digital profit", "", "", "", "$27.48"],
        ["", "", "", "", ""],
        ["Printed Conversions (2%)", "", "2", "$90.00", ""],
        ["Cost per printed", "$28.63", "", "", ""],
        ["Total printed cost", "$57.26", "", "", ""],
        ["Printed profit", "", "", "", "$32.74"],
        ["", "", "", "", ""],
        ["TOTAL PER 100 PREVIEWS", "", "", "", ""],
        ["Total Revenue", "", "", "$120.00", ""],
        ["Total Costs", "$68.78", "", "", ""],
        ["- Preview costs", "$9.00", "", "", ""],
        ["- Digital costs", "$2.52", "", "", ""],
        ["- Printed costs", "$57.26", "", "", ""],
        ["", "", "", "", ""],
        ["NET PROFIT", "", "", "", "$51.22"],
        ["Profit Margin", "", "", "", "42.7%"],
        ["Profit per Preview", "", "", "", "$0.51"],
        ["", "", "", "", ""],
        ["BREAK-EVEN ANALYSIS", "", "", "", ""],
        ["Monthly Fixed Costs", "$134.00", "", "", ""],
        ["Previews needed to break even", "262", "", "", ""],
        ["(at 4% conversion rate)", "", "", "", ""],
        ["", "", "", "", ""],
        ["Conversions needed", "10.5", "", "", ""],
        ["- Digital books", "2.6", "", "", ""],
        ["- Printed books", "7.9", "", "", ""],
    ]
    
    with open('02_Conversion_Funnel.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(funnel_data)
    
    # ============================================
    # TAB 3: 12-MONTH P&L PROJECTION
    # ============================================
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Sample volumes - user can edit these
    preview_volumes = [50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
    
    pnl_data = [
        ["KIDBOOK CREATOR - 12 MONTH P&L PROJECTION", "", "", "", "", "", "", "", "", "", "", "", "", "TOTAL"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["MONTH"] + months + ["YEAR 1"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["VOLUME METRICS (EDITABLE)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Preview Generations"] + preview_volumes + [sum(preview_volumes)],
    ]
    
    # Calculate conversions
    digital_conversions = [round(v * 0.02, 1) for v in preview_volumes]
    printed_conversions = [round(v * 0.02, 1) for v in preview_volumes]
    total_conversions = [d + p for d, p in zip(digital_conversions, printed_conversions)]
    
    pnl_data.extend([
        ["Digital Conversions (2%)"] + digital_conversions + [sum(digital_conversions)],
        ["Printed Conversions (2%)"] + printed_conversions + [sum(printed_conversions)],
        ["Total Conversions"] + total_conversions + [sum(total_conversions)],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["REVENUE", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ])
    
    # Calculate revenue
    digital_revenue = [d * 15 for d in digital_conversions]
    printed_revenue = [p * 45 for p in printed_conversions]
    total_revenue = [d + p for d, p in zip(digital_revenue, printed_revenue)]
    
    pnl_data.extend([
        ["Digital Books ($15 each)"] + [f"${r:.2f}" for r in digital_revenue] + [f"${sum(digital_revenue):.2f}"],
        ["Printed Books ($45 each)"] + [f"${r:.2f}" for r in printed_revenue] + [f"${sum(printed_revenue):.2f}"],
        ["TOTAL REVENUE"] + [f"${r:.2f}" for r in total_revenue] + [f"${sum(total_revenue):.2f}"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["VARIABLE COSTS", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ])
    
    # Calculate costs
    preview_costs = [v * 0.09 for v in preview_volumes]
    digital_costs = [d * 1.26 for d in digital_conversions]
    printed_costs = [p * 28.63 for p in printed_conversions]
    refund_costs = [r * 0.03 for r in total_revenue]  # 3% refund rate
    failed_print_costs = [p * 28.63 * 0.015 for p in printed_conversions]  # 1.5% failed prints
    total_variable = [pc + dc + prc + rc + fpc for pc, dc, prc, rc, fpc in 
                     zip(preview_costs, digital_costs, printed_costs, refund_costs, failed_print_costs)]
    
    pnl_data.extend([
        ["Preview Generation Costs"] + [f"${c:.2f}" for c in preview_costs] + [f"${sum(preview_costs):.2f}"],
        ["Digital Book Costs"] + [f"${c:.2f}" for c in digital_costs] + [f"${sum(digital_costs):.2f}"],
        ["Printed Book Costs"] + [f"${c:.2f}" for c in printed_costs] + [f"${sum(printed_costs):.2f}"],
        ["Refunds (3% of revenue)"] + [f"${c:.2f}" for c in refund_costs] + [f"${sum(refund_costs):.2f}"],
        ["Failed Prints (1.5%)"] + [f"${c:.2f}" for c in failed_print_costs] + [f"${sum(failed_print_costs):.2f}"],
        ["TOTAL VARIABLE COSTS"] + [f"${c:.2f}" for c in total_variable] + [f"${sum(total_variable):.2f}"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["GROSS PROFIT"] + [f"${r - c:.2f}" for r, c in zip(total_revenue, total_variable)] + 
            [f"${sum(total_revenue) - sum(total_variable):.2f}"],
        ["Gross Margin %"] + [f"{((r - c) / r * 100) if r > 0 else 0:.1f}%" for r, c in zip(total_revenue, total_variable)] + 
            [f"{((sum(total_revenue) - sum(total_variable)) / sum(total_revenue) * 100):.1f}%"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["FIXED COSTS", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Monthly Fixed Costs"] + ["$134.00"] * 12 + ["$1,608.00"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["NET PROFIT"] + [f"${r - c - 134:.2f}" for r, c in zip(total_revenue, total_variable)] + 
            [f"${sum(total_revenue) - sum(total_variable) - 1608:.2f}"],
        ["Net Margin %"] + [f"{((r - c - 134) / r * 100) if r > 0 else 0:.1f}%" for r, c in zip(total_revenue, total_variable)] + 
            [f"{((sum(total_revenue) - sum(total_variable) - 1608) / sum(total_revenue) * 100):.1f}%"],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["CUMULATIVE NET PROFIT"] + [f"${sum([total_revenue[j] - total_variable[j] - 134 for j in range(i+1)]):.2f}" 
                                     for i in range(12)] + [""],
    ])
    
    with open('03_Monthly_PNL.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(pnl_data)
    
    # ============================================
    # TAB 4: SENSITIVITY ANALYSIS
    # ============================================
    sensitivity_data = [
        ["SENSITIVITY ANALYSIS", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["CONVERSION RATE IMPACT (Monthly: 300 Previews)", "", "", "", "", ""],
        ["Conversion Rate", "2%", "3%", "4%", "5%", "6%"],
        ["Total Conversions", "6", "9", "12", "15", "18"],
        ["Digital (25%)", "1.5", "2.3", "3.0", "3.8", "4.5"],
        ["Printed (75%)", "4.5", "6.8", "9.0", "11.3", "13.5"],
        ["", "", "", "", "", ""],
        ["Revenue", "", "", "", "", ""],
        ["Digital Revenue", "$22.50", "$33.75", "$45.00", "$56.25", "$67.50"],
        ["Printed Revenue", "$202.50", "$303.75", "$405.00", "$506.25", "$607.50"],
        ["Total Revenue", "$225.00", "$337.50", "$450.00", "$562.50", "$675.00"],
        ["", "", "", "", "", ""],
        ["Costs", "", "", "", "", ""],
        ["Preview Costs", "$27.00", "$27.00", "$27.00", "$27.00", "$27.00"],
        ["Variable Costs", "$131.72", "$197.58", "$263.44", "$329.30", "$395.16"],
        ["Fixed Costs", "$134.00", "$134.00", "$134.00", "$134.00", "$134.00"],
        ["Total Costs", "$292.72", "$358.58", "$424.44", "$490.30", "$556.16"],
        ["", "", "", "", "", ""],
        ["Net Profit", "-$67.72", "-$21.08", "$25.56", "$72.20", "$118.84"],
        ["Net Margin %", "-30.1%", "-6.2%", "5.7%", "12.8%", "17.6%"],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["PRICING IMPACT (Monthly: 300 Previews, 4% Conversion)", "", "", "", "", ""],
        ["Printed Book Price", "$40", "$42", "$45", "$48", "$50"],
        ["", "", "", "", "", ""],
        ["Printed Revenue", "$360.00", "$378.00", "$405.00", "$432.00", "$450.00"],
        ["Digital Revenue", "$45.00", "$45.00", "$45.00", "$45.00", "$45.00"],
        ["Total Revenue", "$405.00", "$423.00", "$450.00", "$477.00", "$495.00"],
        ["", "", "", "", "", ""],
        ["Variable Costs", "$263.44", "$263.44", "$263.44", "$263.44", "$263.44"],
        ["Fixed Costs", "$134.00", "$134.00", "$134.00", "$134.00", "$134.00"],
        ["", "", "", "", "", ""],
        ["Net Profit", "$7.56", "$25.56", "$52.56", "$79.56", "$97.56"],
        ["Net Margin %", "1.9%", "6.0%", "11.7%", "16.7%", "19.7%"],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["VOLUME SCENARIOS (4% Conversion, Current Pricing)", "", "", "", "", ""],
        ["Scenario", "Low", "Medium", "High", "Very High", ""],
        ["Monthly Previews", "100", "300", "500", "1000", ""],
        ["", "", "", "", "", ""],
        ["Conversions", "4", "12", "20", "40", ""],
        ["Revenue", "$150.00", "$450.00", "$750.00", "$1,500.00", ""],
        ["Variable Costs", "$87.81", "$263.44", "$439.06", "$878.13", ""],
        ["Fixed Costs", "$134.00", "$134.00", "$134.00", "$134.00", ""],
        ["", "", "", "", "", ""],
        ["Net Profit", "-$71.81", "$52.56", "$176.94", "$487.87", ""],
        ["Net Margin %", "-47.9%", "11.7%", "23.6%", "32.5%", ""],
        ["", "", "", "", "", ""],
        ["Break-even Previews", "262", "", "", "", ""],
        ["(at 4% conversion)", "", "", "", "", ""],
    ]
    
    with open('04_Sensitivity_Analysis.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(sensitivity_data)
    
    # ============================================
    # TAB 5: SUMMARY DASHBOARD
    # ============================================
    summary_data = [
        ["KIDBOOK CREATOR - EXECUTIVE SUMMARY", "", "", ""],
        ["", "", "", ""],
        ["KEY METRICS (Year 1 - Based on Sample Volumes)", "", "", ""],
        ["", "", "", ""],
        ["Total Preview Generations", "3,075", "", ""],
        ["Total Conversions", "123", "4.0%", ""],
        ["- Digital Books", "31", "25%", ""],
        ["- Printed Books", "92", "75%", ""],
        ["", "", "", ""],
        ["FINANCIAL PERFORMANCE", "", "", ""],
        ["Total Revenue", "$4,605.00", "", ""],
        ["- Digital Revenue", "$461.25", "10%", ""],
        ["- Printed Revenue", "$4,143.75", "90%", ""],
        ["", "", "", ""],
        ["Total Variable Costs", "$2,703.56", "", ""],
        ["Total Fixed Costs", "$1,608.00", "", ""],
        ["Total Costs", "$4,311.56", "", ""],
        ["", "", "", ""],
        ["Gross Profit", "$1,901.44", "41.3%", ""],
        ["Net Profit", "$293.44", "6.4%", ""],
        ["", "", "", ""],
        ["UNIT ECONOMICS", "", "", ""],
        ["", "", "", ""],
        ["Per Preview", "", "", ""],
        ["Cost", "$0.09", "", ""],
        ["Revenue (after conversion)", "$1.50", "", ""],
        ["Profit", "$0.10", "", ""],
        ["", "", "", ""],
        ["Per Digital Book", "", "", ""],
        ["Revenue", "$15.00", "", ""],
        ["Cost", "$1.26", "", ""],
        ["Gross Profit", "$13.74", "91.6%", ""],
        ["", "", "", ""],
        ["Per Printed Book", "", "", ""],
        ["Revenue", "$45.00", "", ""],
        ["Cost", "$28.63", "", ""],
        ["Gross Profit", "$16.37", "36.4%", ""],
        ["", "", "", ""],
        ["BREAK-EVEN ANALYSIS", "", "", ""],
        ["Monthly Fixed Costs", "$134.00", "", ""],
        ["Previews needed per month", "262", "", ""],
        ["Conversions needed per month", "10.5", "", ""],
        ["- Digital books", "2.6", "", ""],
        ["- Printed books", "7.9", "", ""],
        ["", "", "", ""],
        ["SETUP COSTS", "", "", ""],
        ["One-time Setup Investment", "$675.00", "", ""],
        ["Months to recover setup", "2.3", "", "Based on avg monthly profit"],
        ["", "", "", ""],
        ["KEY ASSUMPTIONS", "", "", ""],
        ["Conversion Rate", "4.0%", "2% digital + 2% printed", ""],
        ["Digital/Printed Mix", "25% / 75%", "", ""],
        ["Refund Rate", "3.0%", "", ""],
        ["Failed Print Rate", "1.5%", "", ""],
        ["Target Market", "100% EU", "", ""],
        ["", "", "", ""],
        ["PRICING STRATEGY", "", "", ""],
        ["Digital Book", "$15.00", "92% margin", ""],
        ["Printed Hardcover", "$45.00", "36% margin", ""],
        ["Blended Margin", "", "41%", "Based on mix"],
    ]
    
    with open('05_Summary_Dashboard.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(summary_data)
    
    print("✓ Generated 5 CSV files:")
    print("  1. 01_Assumptions.csv")
    print("  2. 02_Conversion_Funnel.csv")
    print("  3. 03_Monthly_PNL.csv")
    print("  4. 04_Sensitivity_Analysis.csv")
    print("  5. 05_Summary_Dashboard.csv")
    print("\nTo create Excel file:")
    print("1. Open Excel")
    print("2. Import each CSV file as a separate sheet")
    print("3. Format as needed (add colors, charts, etc.)")
    print("\nAlternatively, install openpyxl and run with --excel flag")

if __name__ == "__main__":
    generate_csv_files()
