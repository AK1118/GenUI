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
  isPendingSweep: boolean = false;
  eagerWinner: GestureArenaMember;
  members: GestureArenaMember[] = new Array<GestureArenaMember>();
  add(member: GestureArenaMember) {
    if(!this.isOpen) return;
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
  get isEmpty(): boolean {
    return this.count === 0;
  }
  get first(): GestureArenaMember {
    return this.members[0];
  }
  clear() {
    this.members = [];
  }
}

class GestureArenaManager {
  private arenas: Map<number, GestureArena> = new Map();
  add(pointer: number, member: GestureArenaMember): GestureArenaEntry {
    let arena = this.arenas.get(pointer);
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
  close(pointer: number) {
    const arena: GestureArena = this.arenas.get(pointer);
    if (!arena || !arena.isOpen) return;
    arena.close();
    this.tryToResolveArena(pointer, arena);
  }
  sweep(pointer: number) {
    const arena: GestureArena = this.arenas.get(pointer);
    if (!arena) return;
    if(arena.isOpen)return;
    if (arena.isHeld) {
      arena.isPendingSweep = true;
      return;
    }
    this.arenas.delete(pointer);
    if (!arena.isEmpty) {
      arena.first.acceptGesture(pointer);
      arena.remove(arena.first);
      const members = arena.members;
      members.forEach((rejectedMember) => {
        rejectedMember.rejectGesture(pointer);
      });
    }
  }

  hold(pointer: number) {
    const arena: GestureArena = this.arenas.get(pointer);
    if (!arena) return;
    arena.isHeld = true;
  }

  release(pointer: number) {
    const arena: GestureArena = this.arenas.get(pointer);
    if (!arena) return;
    arena.isHeld = false;
    if (arena.isPendingSweep) {
      this.sweep(pointer);
    }
  }

  private tryToResolveArena(pointer: number, arena: GestureArena) {
    if(arena.isOpen) return;
    if (arena.count === 1) {
      this.arenas.delete(pointer);
      arena.first.acceptGesture(pointer);
    } else if (arena.isEmpty) {
      this.arenas.delete(pointer);
    }
  }
  private resolveInFavorOf(
    pointer: number,
    arena: GestureArena,
    member: GestureArenaMember
  ) {
   
    const state = this.arenas.get(pointer);
    if (state !== arena) return;
    state.remove(member);
    const members = arena.members;
    members.forEach((rejectedMember) => {
      if (member !== rejectedMember) rejectedMember.rejectGesture(pointer);
    });
    state.clear();
    this.arenas.delete(pointer);
    member.acceptGesture(pointer);
    
  }
}

export default GestureArenaManager;
