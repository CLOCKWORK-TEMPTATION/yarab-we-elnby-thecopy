import { NextRequest, NextResponse } from 'next/server'
import { Workbook } from 'exceljs'
import type { Budget } from '../../../lib/types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const budget: Budget = body.budget

        if (!budget) {
            return NextResponse.json(
                { error: 'Budget data is required' },
                { status: 400 }
            )
        }

        // Calculate totals for summary if not present in a "summary" object like the old App,
        // The Budget type has grandTotal, and sections with totals.
        // We need to map the sections to "Above The Line", "Production", etc.
        const getSectionTotal = (id: string) => budget.sections.find((s: any) => s.id === id)?.total || 0;

        const atlTotal = getSectionTotal('atl');
        const prodTotal = getSectionTotal('production');
        const postTotal = getSectionTotal('post');
        const otherTotal = getSectionTotal('other');

        const workbook = new Workbook()
        workbook.creator = 'Film Budget Generator'
        workbook.created = new Date()

        // Create Top Sheet
        const topSheet = workbook.addWorksheet('Top sheet')

        // Above The Line section
        topSheet.addRow(['Above The Line', '', ''])
        topSheet.addRow(['ACCT#', 'Description', 'Total'])
        // Add logic to iterate items if needed, or just totals
        // For Top Sheet, we usually just list categories or grand totals.
        // The previous implementation hardcoded some "ACCT#" rows. 
        // Let's use the actual data from the budget object.

        // Helper to add section to top sheet
        const addSectionToTopSheet = (sectionId: string, title: string) => {
            const section = budget.sections.find((s: any) => s.id === sectionId);
            if (!section) return;

            topSheet.addRow([title, '', '']);
            topSheet.addRow(['ACCT#', 'Description', 'Total']);
            section.categories.forEach((cat: any) => {
                topSheet.addRow([cat.code, cat.name, cat.total]);
            });
            topSheet.addRow([]);
        }

        addSectionToTopSheet('atl', 'Above The Line');
        addSectionToTopSheet('production', 'Production Expenses');
        addSectionToTopSheet('post', 'Post Production Expenses');
        addSectionToTopSheet('other', 'Other Expenses');

        topSheet.addRow([])
        topSheet.addRow(['Grand Total', '', budget.grandTotal])

        // Style Top Sheet
        topSheet.getColumn(1).width = 20
        topSheet.getColumn(2).width = 30
        topSheet.getColumn(3).width = 15

        // Create detailed sheets for each section
        budget.sections.forEach((section: any) => {
            // Sanitize sheet name length (max 31 chars in Excel)
            const sheetName = section.name.substring(0, 30);
            const sheet = workbook.addWorksheet(sheetName);

            section.categories.forEach((category: any) => {
                sheet.addRow([category.name, '', '', '', '', '']);
                sheet.addRow(['ACCT#', 'Description', 'Amount', 'Unit', 'Rate', 'Total']);

                category.items.forEach(item => {
                    sheet.addRow([
                        item.code,
                        item.description,
                        item.amount,
                        item.unit,
                        item.rate,
                        item.total
                    ]);
                });
                sheet.addRow([]);
            });

            // Style columns
            sheet.getColumn(1).width = 12
            sheet.getColumn(2).width = 25
            sheet.getColumn(3).width = 10
            sheet.getColumn(4).width = 10
            sheet.getColumn(5).width = 10
            sheet.getColumn(6).width = 12
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${(budget.metadata?.title || 'Budget').replace(/\s+/g, '_')}.xlsx"`,
            },
        })
    } catch (error) {
        console.error('Error exporting budget:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to export budget' },
            { status: 500 }
        )
    }
}
