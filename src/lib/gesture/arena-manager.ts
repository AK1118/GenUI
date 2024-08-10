export enum GestureDisposition {
  /// This gesture was accepted as the interpretation of the user's input.
  accepted = "accepted",

  /// This gesture was rejected as the interpretation of the user's input.
  rejected = "rejected",
}

export abstract class GestureArenaMember {
  abstract acceptGesture(pointer: number): void;
  abstract rejectGesture(pointer: number): void;
}

export class GestureArenaEntry {
  constructor(
    arena: GestureArenaManager,
    pointer: number,
    member: GestureArenaMember
  ) {
    this._arena = arena;
    this._pointer = pointer;
    this._member = member;
  }

  private _arena: GestureArenaManager;
  private _pointer: number;
  private _member: GestureArenaMember;

  resolve(disposition: GestureDisposition): void {
    this._arena._resolve(this._pointer, this._member, disposition);
  }
}

class GestureArena {
  isOpen: boolean = true;
  isHeld: boolean = false;
  eagerWinner: GestureArenaMember;
  members: GestureArenaMember[];
  add(member: GestureArenaMember) {
    this.members.push(member);
  }
  contain(member: GestureArenaMember) {
    return this.members.indexOf(member) >= 0;
  }
  remove(member: GestureArenaMember) {
    const index = this.members.indexOf(member);
    if (index < 0) {
      return;
    }
    this.members.splice(index, 1);
  }
  get count(): number {
    return this.members.length;
  }
  close() {
    this.isOpen = false;
  }
  get first(): GestureArenaMember {
    return this.members[0];
  }
}

class GestureArenaManager {
  private arenas: Map<number, GestureArena> = new Map();
  add(pointer: number, member: GestureArenaMember): GestureArenaEntry {
    let arena = this.arenas[pointer];
    if (arena == null) {
      arena = new GestureArena();
      this.arenas.set(pointer, arena);
    }
    arena.add(member);
    return new GestureArenaEntry(this, pointer, member);
  }
  _resolve(
    pointer: number,
    member: GestureArenaMember,
    disposition: GestureDisposition
  ) {
    const arena = this.arenas.get(pointer);
    if (arena == null) return;
    if (!arena.contain(member)) return;
    if (disposition === GestureDisposition.rejected) {
      arena.remove(member);
      if (!arena.isOpen) {
        this.tryToResolveArena(pointer, arena);
      } else {
        arena.eagerWinner = member;
      }
    } else {
      this.resolveInFavorOf(pointer, arena, member);
    }
  }

  private tryToResolveArena(pointer: number, arena: GestureArena) {
    if (arena.count === 1) {
    } else if (arena.count === 0) {
      this.arenas.delete(pointer);
    }
    arena.first.acceptGesture(pointer);
  }
  private resolveInFavorOf(
    pointer: number,
    arena: GestureArena,
    member: GestureArenaMember
  ) {
   const state= this.arenas.get(pointer);
   if(state!===arena)return;
   const members= arena.members;
  }
}

export default GestureArenaManager;
