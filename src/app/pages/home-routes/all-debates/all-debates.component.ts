import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../../services/auth-service/auth-service.service';
import { DebateService } from '../../../services/debate-service/debate.service';

@Component({
  selector: 'app-all-debates',
  templateUrl: './all-debates.component.html',
  styleUrl: './all-debates.component.css',
})
export class AllDebatesComponent {
@ViewChild(MatPaginator) paginator!: MatPaginator;

  searchQuery: string = '';
  likes: number = 0;
  votes: number = 0;
  postedAfter: any;
  exactMatch: boolean = false;

  allDebates: any[] = [];
  filteredDebates: any[] = [];
  displayedDebates: any[] = [];

  totalElements: number = 0;
  currentPage: number = 1;
  size: number = 5;
  firstPage: boolean = true;
  lastPage: boolean = true;
  isFiltered: boolean = false;

  constructor(
    private _auth: AuthServiceService,
    private _router: Router,
    private _snack: MatSnackBar,
    private _debate: DebateService
  ) {
    // Redirect if not logged in
    this._auth.isLoggedIn$.subscribe((res) => {
      if (!res) {
        this._router.navigate(['/login']);
        this._snack.open('Please login to continue', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  ngOnInit() {
    this.fetchDebates();
  }

  fetchDebates() {
    this._debate.getAllDebates().subscribe({
      next: (res: any) => {
        this.allDebates = res.map((debate: any) => {
          const totalVotes = debate.options.reduce(
            (sum: any, option: { totalVotes: any }) => sum + option.totalVotes,
            0
          );
          return {
            ...debate,
            totalVotes,
            chartOptions: this.generateChartOptions(debate.options, totalVotes),
          };
        });
        this.applyFiltersAndPagination();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  applyFiltersAndPagination() {
    let filteredData = [...this.allDebates];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      filteredData = filteredData.filter(
        (debate) =>
          debate.text.toLowerCase().includes(query) ||
          debate.createdBy.name.toLowerCase().includes(query)
      );
    }

    // Apply other filters (likes, votes, postedAfter)
    const minLikes = this.likes || 0;
    const minVotes = this.votes || 0;
    const postedAfterDate = this.postedAfter
      ? new Date(this.postedAfter)
      : null;

    filteredData = filteredData.filter((debate) => {
      const matchesLikes = debate.totalLikes >= minLikes;
      const matchesVotes = debate.totalVotes >= minVotes;
      const matchesPostedAfter = postedAfterDate
        ? new Date(debate.createdOn) > postedAfterDate
        : true;

      return matchesLikes && matchesVotes && matchesPostedAfter;
    });

    // Update filteredDebates and totalElements
    this.filteredDebates = filteredData;
    this.totalElements = filteredData.length;

    // Reset paginator to the first page if filtering is applied
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.paginateData();
  }

  paginateData() {
    const startIndex = (this.currentPage - 1) * this.size;
    const endIndex = Math.min(startIndex + this.size, this.totalElements);

    // Paginated data
    this.displayedDebates = this.filteredDebates.slice(startIndex, endIndex);

    // Update pagination flags
    this.firstPage = this.currentPage === 1;
    this.lastPage = endIndex >= this.totalElements;
  }

  onPageChange(event: any) {
    this.size = event.pageSize;
    this.currentPage = event.pageIndex + 1; // MatPaginator is 0-based
    this.paginateData();
  }

  clearFilters() {
    this.searchQuery = '';
    this.likes = 0;
    this.votes = 0;
    this.postedAfter = null;
    this.currentPage = 1; // Reset to the first page
    this.isFiltered = false;

    if (this.paginator) {
      this.paginator.firstPage(); // Reset paginator to the first page
    }

    this.applyFiltersAndPagination();
  }

  onSearch() {
    this.isFiltered = true;
    this.currentPage = 1; // Reset to the first page when search is performed
    this.applyFiltersAndPagination();
  }

  onFilterChange() {
    this.isFiltered = true;
    this.currentPage = 1; // Reset to the first page when filters change
    this.applyFiltersAndPagination();
  }

  generateChartOptions(options: any[], totalVotes: number) {
    const yAxisMax = totalVotes > 0 ? Math.ceil(totalVotes / 5) * 5 : 10;
    return {
      animationEnabled: true,
      axisY: {
        title: 'Total Votes',
        includeZero: true,
        maximum: yAxisMax,
      },
      axisX: {
        labelFormatter: () => '',
      },
      data: [
        {
          type: 'column',
          indexLabel: '{y}',
          indexLabelFontColor: '#5A5757',
          toolTipContent: '{label}: {y}',
          dataPoints: options.map((option) => ({
            label: option.text,
            y: option.totalVotes || 0,
          })),
        },
      ],
    };
  }
}
