import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthServiceService } from '../../../services/auth-service/auth-service.service';
import { DebateService } from '../../../services/debate-service/debate.service';
import { VoteService } from '../../../services/vote-service/vote.service';

@Component({
  selector: 'app-debate-poll',
  templateUrl: './debate-poll.component.html',
  styleUrl: './debate-poll.component.css',
})
export class DebatePollComponent implements OnInit {
  constructor(
    private _debate: DebateService,
    private _route: ActivatedRoute,
    private _auth: AuthServiceService,
    private _snack: MatSnackBar,
    private _vote: VoteService,
    private _router: Router
  ) {
    this._auth.isLoggedIn$.subscribe((res) => {
      if (!res) {
        this._router.navigate(['/login']);
        this._snack.open('Please login to continue', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  private likeSubject = new BehaviorSubject<number>(0);
  likes$ = this.likeSubject.asObservable();

  private dislikeSubject = new BehaviorSubject<number>(0);
  dislikes$ = this.dislikeSubject.asObservable(); // Fixed here

  private voteSubject = new BehaviorSubject<number>(0);
  votes$ = this.voteSubject.asObservable();

  hasLiked: boolean = false;

  hasDisliked: boolean = false;

  totalVotes: number = 0;

  debateId: any;
  userId: any;
  debate: any = {};
  votes: any = [];

  ngOnInit(): void {
    this.debateId = this._route.snapshot.params['id'];
    this.userId = this._auth.getUser().id;
    this.fetchDebateDetails();
  }

  handleVote(id: number, increment: boolean): void {
    // Calculate total votes, excluding blocked options
    const currentTotalVotes = this.debate.options.reduce(
      (sum: number, option: any) =>
        option.blocked ? sum : sum + option.userVotes,
      0
    );

    const selectedOption = this.debate.options.find(
      (option: any) => option.id === id
    );

    if (increment && currentTotalVotes >= 10) {
      alert('Total votes cannot exceed 10.');
      return;
    }

    if (selectedOption && !selectedOption.isBlocked) {
      const newTotalVotes = increment
        ? currentTotalVotes + 1
        : currentTotalVotes - 1;

      if (newTotalVotes <= 10) {
        this.debate.options = this.debate.options.map((option: any) =>
          option.id === id
            ? {
              ...option,
              userVotes: increment
                ? option.userVotes + 1
                : Math.max(0, option.userVotes - 1),
            }
            : option
        );
      } else {
        alert('Cannot exceed a total of 10 votes.');
      }
    } else if (selectedOption && selectedOption.isBlocked) {
      alert('This option is blocked and cannot be voted on.');
    }
  }

  submitVotes(): void {
    this._auth.fetchUser(this.userId).subscribe(() => {
      if (this._auth.getUser().blocked === true) {
        this._snack.open('You are blocked from voting!', 'Close', {
          duration: 2000,
        });
        return;
      }
      if (this.debate.blocked) {
        this._snack.open('Debate is closed!', 'Close', {
          duration: 2000,
        });
        return;
      }
      const voteData = this.debate.options.map((option: any) => ({
        optionId: option.id,
        debateId: this.debateId,
        userId: this.userId,
        totalVotes: option.userVotes,
      }));
      console.log(voteData);
      this._vote.vote(voteData).subscribe(
        (res: any) => {
          console.log(res);
          this._snack.open('Votes submitted!', 'Close', {
            duration: 2000,
          });
          this.fetchDebateDetails(); // Fetch the latest debate details after submitting votes
        },
        (err) => {
          console.log(err);
          this._snack.open("Cannot vote 0 for all the options!", 'Close', {
            duration: 2000,
          });
          this.fetchDebateDetails(); // Fetch the latest debate details after submitting votes
        }
      );
    });
  }

  handleLikeDislike(like: boolean): void {
    this._auth.fetchUser(this.userId).subscribe(() => {
      if (this._auth.getUser().blocked === true) {
        this._snack.open('You are blocked from liking/disliking!', 'Close', {
          duration: 2000,
        });
        return;
      }
      if (this.debate.blocked) {
        this._snack.open('Debate is closed!', 'Close', {
          duration: 2000,
        });
        return;
      }
      if (like) {
        this._debate.likeDebate(this.debateId, this.userId).subscribe(
          (res: any) => {
            this.fetchDebateDetails(); // Fetch the latest debate details after liking
          },
          (err) => {
            console.error(err);
          }
        );
      } else {
        this._debate.dislikeDebate(this.debateId, this.userId).subscribe(
          (res: any) => {
            this.fetchDebateDetails(); // Fetch the latest debate details after disliking
          },
          (err) => {
            console.error(err);
          }
        );
      }
    });
  }

  fetchDebateDetails(): void {
    this._debate.getDebate(this.debateId).subscribe(
      (res: any) => {
        this.debate = res;
        console.log(res);
        this.hasLiked = res.likes.some((user: any) => user.id === this.userId);
        this.hasDisliked = res.dislikes.some(
          (user: any) => user.id === this.userId
        );
        console.log(this.hasLiked, this.hasDisliked);
        this.likeSubject.next(res.totalLikes); // Update the likes BehaviorSubject
        this.dislikeSubject.next(res.totalDislikes); // Update the dislikes BehaviorSubject
        const blockedVotes = res.options
          .filter((option: any) => option.blocked) // Filter blocked options
          .reduce(
            (sum: number, option: any) => sum + (option.totalVotes || 0),
            0
          ); // Sum their votes
        const adjustedTotalVotes = res.totalVotes - blockedVotes;
        this.voteSubject.next(adjustedTotalVotes); // Update the votes BehaviorSubject

        this.votes$.subscribe((vote) => {
          this.totalVotes = vote;
          console.log('Votes: ', vote);
        });

        this._vote
          .getVotesByUser(this.userId, this.debateId)
          .subscribe((res: any) => {
            console.log(res);
            this.votes = res;
            this.debate.options = this.debate.options.map((option: any) => {
              const vote = this.votes.find(
                (vote: any) => vote.option.id === option.id
              );
              return vote
                ? { ...option, userVotes: vote.votes }
                : { ...option, userVotes: 0 };
            });
          });
        console.log(this.debate);
      },
      (err) => {
        console.error('Error fetching debate details:', err);
      }
    );
  }
}
