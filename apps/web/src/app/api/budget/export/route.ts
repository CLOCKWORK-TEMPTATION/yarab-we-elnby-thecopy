import { NextRequest, NextResponse } from 'next/server';
import { Workbook } from 'exceljs';
// Import from BUDGET directory using path alias
import type { Budget } from '@/app/(main)/BUDGET/lib/types';

interface ExportBudgetRequest {
  budget: Budget;
}

interface ExportBudgetResponse {
  success: boolean;
  error?: string;
}

function isValidContentType(contentType: string | null): boolean {
  return contentType === 'application/json' || contentType?.includes('application/json');
}

function createErrorResponse(message: string, status: number): NextResponse<ExportBudgetResponse> {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

function isBudgetValid(budget: unknown): budget is Budget {
  if (!budget || typeof budget !== 'object') return false;
  const b = budget as Record<string, unknown>;
  return (
    'sections' in b &&
    Array.isArray(b.sections) &&
    'grandTotal' in b &&
    typeof b.grandTotal === 'number'
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<ExportBudgetResponse | Buffer>> {
  try {
    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!isValidContentType(contentType)) {
      return createErrorResponse('Content-Type must be application/json', 415);
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    if (!body || typeof body !== 'object') {
      return createErrorResponse('Request body must be a JSON object', 400);
    }

    const { budget } = body as ExportBudgetRequest;

    // Validate budget data
    if (!isBudgetValid(budget)) {
      return createErrorResponse(
        'Budget data is required and must include sections (array) and grandTotal (number)',
        400
      );
    }

    // Calculate section totals
    const getSectionTotal = (id: string): number => 
      budget.sections.find((s) => s.id === id)?.total || 0;

    const workbook = new Workbook();
    workbook.creator = 'Film Budget Generator';
    workbook.created = new Date();

    // Create Top Sheet
    const topSheet = workbook.addWorksheet('Top sheet');

    // Helper to add section to top sheet
    const addSectionToTopSheet = (sectionId: string, title: string) => {
      const section = budget.sections.find((s) => s.id === sectionId);
      if (!section) return;

      topSheet.addRow([title, '', '']);
      topSheet.addRow(['ACCT#', 'Description', 'Total']);
      
      if (Array.isArray(section.categories)) {
        section.categories.forEach((cat) => {
          topSheet.addRow([
            cat?.code ?? '',
            cat?.name ?? '',
            cat?.total ?? 0
          ]);
        });
      }
      
      topSheet.addRow([]);
    };

    addSectionToTopSheet('atl', 'Above The Line');
    addSectionToTopSheet('production', 'Production Expenses');
    addSectionToTopSheet('post', 'Post Production Expenses');
    addSectionToTopSheet('other', 'Other Expenses');

    topSheet.addRow([]);
    topSheet.addRow(['Grand Total', '', budget.grandTotal]);

    // Style Top Sheet
    topSheet.getColumn(1).width = 20;
    topSheet.getColumn(2).width = 30;
    topSheet.getColumn(3).width = 15;

    // Create detailed sheets for each section
    budget.sections.forEach((section) => {
      // Sanitize sheet name length (max 31 chars in Excel)
      const sheetName = (section.name ?? 'Section').substring(0, 30);
      const sheet = workbook.addWorksheet(sheetName);

      if (Array.isArray(section.categories)) {
        section.categories.forEach((category) => {
          sheet.addRow([category?.name ?? '', '', '', '', '', '']);
          sheet.addRow(['ACCT#', 'Description', 'Amount', 'Unit', 'Rate', 'Total']);

          if (Array.isArray(category?.items)) {
            category.items.forEach((item) => {
              sheet.addRow([
                item?.code ?? '',
                item?.description ?? '',
                item?.amount ?? 0,
                item?.unit ?? '',
                item?.rate ?? 0,
                item?.total ?? 0
              ]);
            });
          }

          sheet.addRow([]);
        });
      }

      // Style columns
      sheet.getColumn(1).width = 12;
      sheet.getColumn(2).width = 25;
      sheet.getColumn(3).width = 10;
      sheet.getColumn(4).width = 10;
      sheet.getColumn(5).width = 10;
      sheet.getColumn(6).width = 12;
    });

    // Generate buffer
    let buffer: Buffer;
    try {
      buffer = await workbook.xlsx.writeBuffer() as Buffer;
    } catch (bufferError) {
      console.error('Error generating Excel buffer:', bufferError);
      return createErrorResponse('Failed to generate Excel file', 500);
    }

    // Generate filename
    const filename = (budget.metadata?.title ?? 'Budget')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '49',
        'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to export budget';
    console.error('Error exporting budget:', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}
